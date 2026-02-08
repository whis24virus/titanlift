use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::AppState;

#[derive(Serialize)]
pub struct FollowStats {
    pub followers: i64,
    pub following: i64,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct UserProfileSocial {
    pub id: Uuid,
    pub username: String,
    pub bio: Option<String>,
    pub instagram: Option<String>,
    pub twitter: Option<String>,
    pub followers: i64,
    pub following: i64,
    pub is_following: bool, // Does the requester follow this user?
}

// Request payload for update profile
#[derive(Deserialize)]
pub struct UpdateSocialProfileRequest {
    pub bio: Option<String>,
    pub instagram: Option<String>,
    pub twitter: Option<String>,
}

pub async fn follow_user(
    State(state): State<AppState>,
    Path(target_id): Path<Uuid>,
    // In a real app, user_id comes from Auth middleware
    // We'll simulate auth via a header or just hardcode for demo if needed
    // queries override for now
) -> impl IntoResponse {
    // HARDCODED DEMO USER ID for now
    let user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap();

    let result = sqlx::query!(
        "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user_id,
        target_id
    )
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn unfollow_user(
    State(state): State<AppState>,
    Path(target_id): Path<Uuid>,
) -> impl IntoResponse {
    let user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap();

    let result = sqlx::query!(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        user_id,
        target_id
    )
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn get_profile(
    State(state): State<AppState>,
    Path(target_id): Path<Uuid>,
) -> impl IntoResponse {
    let current_user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap();

    // Fetch user details + social stats
    let user = sqlx::query_as::<_, UserProfileSocial>(
        r#"
        SELECT 
            u.id, 
            u.username, 
            u.bio, 
            u.instagram_handle as instagram, 
            u.twitter_handle as twitter,
            COALESCE((SELECT COUNT(*) FROM follows WHERE following_id = u.id), 0) as followers,
            COALESCE((SELECT COUNT(*) FROM follows WHERE follower_id = u.id), 0) as following,
            COALESCE(EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id), false) as is_following
        FROM users u
        WHERE u.id = $1
        "#
    )
    .bind(target_id)
    .bind(current_user_id)
    .fetch_optional(&state.db)
    .await
    .unwrap();

    match user {
        Some(u) => Json(u).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

pub async fn update_social_profile(
    State(state): State<AppState>,
    Json(payload): Json<UpdateSocialProfileRequest>,
) -> impl IntoResponse {
    let user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap();

    let result = sqlx::query!(
        "UPDATE users SET bio = $1, instagram_handle = $2, twitter_handle = $3 WHERE id = $4",
        payload.bio,
        payload.instagram,
        payload.twitter,
        user_id
    )
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn get_workout_history(
    State(state): State<AppState>,
    Path(target_id): Path<Uuid>,
) -> impl IntoResponse {
    let history = sqlx::query!(
        r#"
        SELECT id, name, start_time, end_time, 
        COALESCE((SELECT SUM(weight_kg * reps) FROM sets WHERE workout_id = w.id), 0.0) as volume,
        (SELECT COUNT(*) FROM sets WHERE workout_id = w.id) as exercise_count
        FROM workouts w
        WHERE w.user_id = $1 AND w.end_time IS NOT NULL
        ORDER BY w.start_time DESC
        LIMIT 20
        "#,
        target_id
    )
    .fetch_all(&state.db)
    .await;

    match history {
        Ok(recs) => {
            let response = recs.into_iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "name": r.name,
                    "start_time": r.start_time,
                    "end_time": r.end_time,
                    "total_volume_kg": r.volume.unwrap_or(0.0),
                    "exercise_count": r.exercise_count.unwrap_or(0)
                })
            }).collect::<Vec<_>>();
            Json(response).into_response()
        },
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
}

pub async fn get_leaderboard(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let leaderboard = sqlx::query!(
        r#"
        SELECT u.id, u.username, 
        COALESCE(SUM(s.weight_kg * s.reps), 0.0) as total_volume
        FROM users u
        LEFT JOIN workouts w ON u.id = w.user_id
        LEFT JOIN sets s ON w.id = s.workout_id
        GROUP BY u.id, u.username
        ORDER BY total_volume DESC
        LIMIT 10
        "#
    )
    .fetch_all(&state.db)
    .await;


    match leaderboard {
        Ok(recs) => {
             let response = recs.into_iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "username": r.username,
                    "total_volume": r.total_volume.unwrap_or(0.0)
                })
            }).collect::<Vec<_>>();
            Json(response).into_response()
        },
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
}

#[derive(Deserialize)]
pub struct SearchUserQuery {
    pub q: String,
}

pub async fn search_users(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<SearchUserQuery>,
) -> impl IntoResponse {
    let current_user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap();
    let search_term = format!("%{}%", query.q);

    let users = sqlx::query!(
        r#"
        SELECT u.id, u.username, u.bio, u.instagram_handle, u.twitter_handle,
        EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = u.id) as is_following
        FROM users u
        WHERE u.username ILIKE $1 AND u.id != $2
        LIMIT 10
        "#,
        search_term,
        current_user_id
    )
    .fetch_all(&state.db)
    .await;

    match users {
        Ok(recs) => {
            let response = recs.into_iter().map(|r| {
                // Map to same structure as profile or specific search result
                serde_json::json!({
                    "id": r.id,
                    "username": r.username,
                    "bio": r.bio,
                    "is_following": r.is_following.unwrap_or(false)
                })
            }).collect::<Vec<_>>();
            Json(response).into_response()
        },
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
}
