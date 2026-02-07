use axum::{
    extract::{State, Path},
    Json,
    http::StatusCode,
};
use crate::{AppState, models::{Workout, Set}};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateWorkoutRequest {
    pub user_id: Uuid, // In a real app, get this from auth context
    pub name: Option<String>,
    pub start_time: Option<chrono::DateTime<chrono::Utc>>,
    pub template_id: Option<Uuid>,
}

pub async fn create_workout(
    State(state): State<AppState>,
    Json(payload): Json<CreateWorkoutRequest>,
) -> Json<Workout> {
    let workout = sqlx::query_as!(
        Workout,
        "INSERT INTO workouts (user_id, name, start_time, template_id) VALUES ($1, $2, $3, $4) RETURNING *",
        payload.user_id,
        payload.name,
        payload.start_time,
        payload.template_id
    )
    .fetch_one(&state.db)
    .await
    .unwrap(); // Handle error properly in prod

    Json(workout)
}

#[derive(Serialize)]
pub struct LogSetResponse {
    pub set: Set,
    pub is_new_1rm: bool,
    pub is_vol_pr: bool,
}

#[derive(Deserialize)]
pub struct LogSetRequest {
    pub workout_id: Uuid,
    pub exercise_id: Uuid,
    pub weight_kg: f32,
    pub reps: i32,
    pub rpe: Option<f32>,
}

pub async fn log_set(
    State(state): State<AppState>,
    Json(payload): Json<LogSetRequest>,
) -> Result<Json<LogSetResponse>, (StatusCode, String)> {
    // 1. Get User ID from workout
    let workout = sqlx::query!(
        "SELECT user_id FROM workouts WHERE id = $1",
        payload.workout_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch workout user: {}", e)))?;

    let user_id = workout.user_id;

    // 2. Check previous max WEIGHT for this exercise/user
    let prev_max_weight = sqlx::query!(
        r#"
        SELECT MAX(s.weight_kg) as max_val 
        FROM sets s
        JOIN workouts w ON s.workout_id = w.id
        WHERE s.exercise_id = $1 AND w.user_id = $2
        "#,
        payload.exercise_id,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch max weight: {}", e)))?
    .max_val
    .unwrap_or(0.0);

    // 3. Check previous max REPS at this weight (or higher)
    // "Volume PR" (Rep PR): Most reps ever done at this weight or heavier.
    let prev_max_reps = sqlx::query!(
        r#"
        SELECT MAX(s.reps) as max_val 
        FROM sets s
        JOIN workouts w ON s.workout_id = w.id
        WHERE s.exercise_id = $1 
        AND w.user_id = $2
        AND s.weight_kg >= $3
        "#,
        payload.exercise_id,
        user_id,
        payload.weight_kg
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch max reps: {}", e)))?
    .max_val
    .unwrap_or(0);

    // 4. Insert Set
    let set = sqlx::query_as!(
        Set,
        "INSERT INTO sets (workout_id, exercise_id, weight_kg, reps, rpe) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        payload.workout_id,
        payload.exercise_id,
        payload.weight_kg,
        payload.reps,
        payload.rpe
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to insert set: {}", e)))?;

    // 5. Determine Rewards
    let is_new_1rm = set.weight_kg > prev_max_weight;
    let is_vol_pr = !is_new_1rm && set.reps > prev_max_reps && set.reps > 5; // Arbitrary min reps to avoid trivial PRs

    Ok(Json(LogSetResponse { set, is_new_1rm, is_vol_pr }))
}

pub async fn list_sets(
    State(state): State<AppState>,
) -> Json<Vec<Set>> {
    let sets = sqlx::query_as!(
        Set,
        "SELECT * FROM sets ORDER BY created_at DESC LIMIT 1000" // Limit for safety
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(sets)
}

pub async fn delete_set(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> StatusCode {
    let result = sqlx::query!(
        "DELETE FROM sets WHERE id = $1",
        id
    )
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[derive(Serialize)]
pub struct FinishWorkoutResponse {
    pub id: Uuid,
    pub end_time: chrono::DateTime<chrono::Utc>,
    pub badges: Vec<String>,
}

pub async fn finish_workout(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Json<FinishWorkoutResponse> {
    let now = chrono::Utc::now();
    
    // 1. Fetch workout details, volume, and user weight
    let workout_data = sqlx::query!(
        r#"
        SELECT 
            w.start_time, 
            w.user_id,
            u.current_weight_kg,
            COALESCE(SUM(s.weight_kg * s.reps), 0) as volume,
            COUNT(s.id) as set_count
        FROM workouts w
        JOIN users u ON w.user_id = u.id
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.id = $1
        GROUP BY w.id, w.start_time, w.user_id, u.current_weight_kg
        "#,
        id
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    // 2. Calculate Stats
    let duration_minutes = if let Some(start) = workout_data.start_time {
        (now - start).num_minutes() as f64
    } else {
        60.0 // Default to 1 hour if start time missing
    };

    let weight = workout_data.current_weight_kg.unwrap_or(75.0) as f64; // Default 75kg
    let volume = workout_data.volume.unwrap_or(0.0) as f64;
    
    // MET Calculation (Metabolic Equivalent of Task)
    // Circuit training/vigorous lifting is ~6.0 METs
    // General lifting is ~3.5 METs
    // Intensity Factor: Volume (kg) per minute. 
    // Example: 10,000kg / 60min = 166 kg/min
    let intensity_factor = if duration_minutes > 0.0 {
        (volume / duration_minutes) / 100.0
    } else {
        1.0
    };
    
    // Clamp METs between 3.0 (light) and 8.0 (extreme)
    let met = (3.0 + intensity_factor).min(8.0f64);
    
    // Calories = MET * Weight(kg) * Duration(hr)
    let duration_hours = duration_minutes / 60.0;
    let calories_burned = (met * weight * duration_hours) as i32;

    // 3. Determine Badges
    let mut badges = Vec::new();
    if volume >= 10000.0 {
        badges.push("Titan Volume".to_string());
    } else if volume >= 5000.0 {
        badges.push("Heavy Lifter".to_string());
    }

    if duration_minutes >= 90.0 {
        badges.push("Marathoner".to_string());
    } else if duration_minutes <= 30.0 && volume > 2000.0 {
        badges.push("Speed Demon".to_string());
    }
    
    if workout_data.set_count.unwrap_or(0) >= 20 {
         badges.push("Volume Warrior".to_string());
    }

    // Insert badges into DB (ignore duplicates via ON CONFLICT usually, but migration has UNIQUE)
    // We use ON CONFLICT DO NOTHING to avoid errors if they re-earn the same badge in the same workout (unlikely/redundant but safe)
    // Actually our unique constraint is (user_id, badge_name, workout_id).
    // So if they do a new workout, they can earn "Heavy Lifter" again?
    // The requirement implies a Trophy Case. Usually you earn a badge once, or multiple times.
    // Let's assume for now we collect them. If we want unique per user (earned once ever), we'd enforce that.
    // The current migration enforces unique per *workout*. So they can earn "Heavy Lifter" multiple times (one per workout).
    // This is good for "Activity" feed, but for "Trophy Case" we might want to group them.
    
    for badge in &badges {
        let _ = sqlx::query!(
            "INSERT INTO user_badges (user_id, workout_id, badge_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            workout_data.user_id,
            id,
            badge
        )
        .execute(&state.db)
        .await;
    }

    // 4. Update Workout
    let _ = sqlx::query!(
        "UPDATE workouts SET end_time = $1, calories_burned = $2 WHERE id = $3",
        now,
        calories_burned,
        id
    )
    .execute(&state.db)
    .await
    .unwrap();

    Json(FinishWorkoutResponse {
        id,
        end_time: now,
        badges,
    })
}

pub async fn get_active_workout(
    State(state): State<AppState>,
) -> Result<Json<Workout>, StatusCode> {
    // Find the most recent workout for DEMO_USER_ID that hasn't ended
    // Ideally user_id comes from auth, but for now hardcoded or passed in query
    let user_id = Uuid::parse_str("763b9c95-4bae-4044-9d30-7ae513286b37").unwrap(); // Demo User

    let workout = sqlx::query_as!(
        Workout,
        "SELECT * FROM workouts WHERE user_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
        user_id
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match workout {
        Some(w) => Ok(Json(w)),
        None => Err(StatusCode::NOT_FOUND),
    }
}
