use axum::{
    extract::{State, Path},
    Json,
};
use crate::{AppState, models::{WorkoutTemplate, TemplateExercise}};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateTemplateRequest {
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
}

pub async fn create_template(
    State(state): State<AppState>,
    Json(payload): Json<CreateTemplateRequest>,
) -> Json<WorkoutTemplate> {
    let template = sqlx::query_as!(
        WorkoutTemplate,
        "INSERT INTO workout_templates (user_id, name, description) VALUES ($1, $2, $3) RETURNING *",
        payload.user_id,
        payload.name,
        payload.description
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(template)
}

pub async fn list_templates(
    State(state): State<AppState>,
) -> Json<Vec<WorkoutTemplate>> {
    let templates = sqlx::query_as!(
        WorkoutTemplate,
        "SELECT * FROM workout_templates ORDER BY created_at DESC"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(templates)
}

#[derive(Deserialize)]
pub struct AddTemplateExerciseRequest {
    pub exercise_id: Uuid,
    pub order_index: i32,
    pub target_sets: i32,
    pub target_reps: i32,
    pub target_weight_kg: Option<f32>,
}

pub async fn add_template_exercise(
    State(state): State<AppState>,
    Path(template_id): Path<Uuid>,
    Json(payload): Json<AddTemplateExerciseRequest>,
) -> Json<TemplateExercise> {
    let exercise = sqlx::query_as!(
        TemplateExercise,
        "INSERT INTO template_exercises (template_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        template_id,
        payload.exercise_id,
        payload.order_index,
        payload.target_sets,
        payload.target_reps,
        payload.target_weight_kg
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(exercise)
}

#[derive(Serialize)] 
pub struct TemplateWithExercises {
    pub template: WorkoutTemplate,
    pub exercises: Vec<TemplateExerciseDetails>,
}

#[derive(Serialize)]
pub struct TemplateExerciseDetails {
    pub id: Uuid,
    pub exercise_id: Uuid,
    pub exercise_name: String, 
    pub target_sets: i32,
    pub target_reps: i32,
    pub target_weight_kg: Option<f32>,
}

pub async fn get_template(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Json<TemplateWithExercises> {
    let template = sqlx::query_as!(
        WorkoutTemplate,
        "SELECT * FROM workout_templates WHERE id = $1",
        id
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    // Join with exercises table to get names
    let exercises = sqlx::query!(
        r#"
        SELECT te.*, e.name as exercise_name 
        FROM template_exercises te
        JOIN exercises e ON te.exercise_id = e.id
        WHERE te.template_id = $1
        ORDER BY te.order_index
        "#,
        id
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let exercise_details = exercises.into_iter().map(|rec| TemplateExerciseDetails {
        id: rec.id,
        exercise_id: rec.exercise_id,
        exercise_name: rec.exercise_name,
        target_sets: rec.target_sets,
        target_reps: rec.target_reps,
        target_weight_kg: rec.target_weight_kg,
    }).collect();

    Json(TemplateWithExercises {
        template,
        exercises: exercise_details,
    })
}

#[derive(Deserialize)]
pub struct UpdateTemplateExercisesRequest {
    pub exercises: Vec<AddTemplateExerciseRequest>,
}

pub async fn update_template_exercises(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTemplateExercisesRequest>,
) -> Json<Vec<TemplateExercise>> {
    // Transaction to ensure atomicity
    let mut tx = state.db.begin().await.unwrap();

    // 1. Delete existing exercises for this template
    sqlx::query!(
        "DELETE FROM template_exercises WHERE template_id = $1",
        id
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    // 2. Insert new exercises
    let mut new_exercises = Vec::new();
    for ex in payload.exercises {
        let inserted = sqlx::query_as!(
            TemplateExercise,
            "INSERT INTO template_exercises (template_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            id,
            ex.exercise_id,
            ex.order_index,
            ex.target_sets,
            ex.target_reps,
            ex.target_weight_kg
        )
        .fetch_one(&mut *tx)
        .await
        .unwrap();
        new_exercises.push(inserted);
    }

    tx.commit().await.unwrap();

    Json(new_exercises)
}
