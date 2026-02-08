use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub gender: Option<String>,
    pub date_of_birth: Option<chrono::NaiveDate>,
    pub height_cm: Option<f64>,
    pub current_weight_kg: Option<f64>,
    pub bio: Option<String>,
    pub instagram_handle: Option<String>,
    pub twitter_handle: Option<String>,
    pub activity_level: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Exercise {
    pub id: Uuid,
    pub name: String,
    pub muscle_group: String,
    pub equipment: Option<String>,
    pub animation_url: Option<String>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Workout {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub notes: Option<String>,
    pub template_id: Option<Uuid>,
    pub calories_burned: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Set {
    pub id: Uuid,
    pub workout_id: Uuid,
    pub exercise_id: Uuid,
    pub weight_kg: f32,
    pub reps: i32,
    pub rpe: Option<f32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct WorkoutTemplate {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TemplateExercise {
    pub id: Uuid,
    pub template_id: Uuid,
    pub exercise_id: Uuid,
    pub order_index: i32,
    pub target_sets: i32,
    pub target_reps: i32,
    pub target_weight_kg: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct WeightLog {
    pub id: Uuid,
    pub user_id: Uuid,
    pub weight_kg: f64,
    pub logged_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct NutritionLog {
    pub id: Uuid,
    pub user_id: Uuid,
    pub log_date: chrono::NaiveDate,
    pub calories_in: i32,
    pub protein_g: Option<i32>,
    pub carbs_g: Option<i32>,
    pub fats_g: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserBadge {
    pub id: Uuid,
    pub user_id: Uuid,
    pub workout_id: Option<Uuid>,
    pub badge_name: String,
    pub earned_at: DateTime<Utc>,
}
