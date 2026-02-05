use axum::{
    extract::State,
    Json,
};
use crate::{AppState, models::Exercise};
use std::sync::Arc;

pub async fn list_exercises(
    State(state): State<AppState>,
) -> Json<Vec<Exercise>> {
    let exercises = sqlx::query_as::<_, Exercise>(
        "SELECT * FROM exercises ORDER BY name"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(exercises)
}
