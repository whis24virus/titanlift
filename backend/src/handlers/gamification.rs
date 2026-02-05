use axum::{
    extract::{State, Path},
    Json,
};
use crate::{AppState, models::UserBadge};
use uuid::Uuid;
use serde::Serialize;

#[derive(Serialize)]
pub struct BadgeGroup {
    pub name: String,
    pub count: i64,
    pub last_earned_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_user_badges(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<Vec<UserBadge>> {
    let badges: Vec<UserBadge> = sqlx::query_as!(
        UserBadge,
        "SELECT * FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC",
        user_id
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(badges)
}
