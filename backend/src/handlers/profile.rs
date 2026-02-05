use axum::{
    extract::{State, Path},
    Json,
};
use crate::{AppState, models::{User, WeightLog, NutritionLog}};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, NaiveDate, Utc};

#[derive(Serialize)]
pub struct PhysicalStatsResponse {
    pub height_cm: Option<f64>,
    pub current_weight_kg: Option<f64>,
    pub gender: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub activity_level: Option<String>,
    pub bmr: Option<i32>,
    pub tdee: Option<i32>,
}

#[derive(Deserialize)]
pub struct UpdateStatsRequest {
    pub height_cm: Option<f64>,
    pub weight_kg: Option<f64>,
    pub gender: Option<String>, // 'male' or 'female'
    pub date_of_birth: Option<NaiveDate>,
    pub activity_level: Option<String>, // 'sedentary', 'light', 'moderate', 'active', 'athlete'
}

pub async fn update_physical_stats(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<UpdateStatsRequest>,
) -> Json<PhysicalStatsResponse> {
    let mut tx = state.db.begin().await.unwrap();

    // 1. Update User Table
    let _ = sqlx::query!(
        r#"
        UPDATE users 
        SET height_cm = COALESCE($1, height_cm),
            current_weight_kg = COALESCE($2, current_weight_kg),
            gender = COALESCE($3, gender),
            date_of_birth = COALESCE($4, date_of_birth),
            activity_level = COALESCE($5, activity_level)
        WHERE id = $6
        "#,
        payload.height_cm,
        payload.weight_kg,
        payload.gender,
        payload.date_of_birth,
        payload.activity_level,
        user_id
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    // 2. If weight changed, log in weight_logs
    if let Some(weight) = payload.weight_kg {
        let _ = sqlx::query!(
            "INSERT INTO weight_logs (user_id, weight_kg) VALUES ($1, $2)",
            user_id,
            weight
        )
        .execute(&mut *tx)
        .await
        .unwrap();
    }

    tx.commit().await.unwrap();

    // 3. Return updated stats with BMR/TDEE
    get_physical_stats(State(state), Path(user_id)).await
}

pub async fn get_physical_stats(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<PhysicalStatsResponse> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        user_id
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    // Calculate BMR (Mifflin-St Jeor)
    let bmr = if let (Some(w), Some(h), Some(dob), Some(gender)) = (
        user.current_weight_kg,
        user.height_cm,
        user.date_of_birth,
        &user.gender,
    ) {
        let age_years = (Utc::now().date_naive() - dob).num_days() / 365;
        // Formula: 10*W + 6.25*H - 5*A + S
        // S: +5 male, -161 female
        let s = if gender == "male" { 5.0 } else { -161.0 };
        let bmr_val = (10.0 * w) + (6.25 * h) + (-5.0 * (age_years as f64)) + s;
        Some(bmr_val as i32)
    } else {
        None
    };

    // Calculate TDEE
    let tdee = if let (Some(bmr_val), Some(level)) = (bmr, &user.activity_level) {
        let multiplier = match level.as_str() {
            "sedentary" => 1.2,
            "light" => 1.375,
            "moderate" => 1.55,
            "active" => 1.725,
            "athlete" => 1.9,
            _ => 1.2,
        };
        Some((bmr_val as f64 * multiplier) as i32)
    } else {
        None
    };

    Json(PhysicalStatsResponse {
        height_cm: user.height_cm,
        current_weight_kg: user.current_weight_kg,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        activity_level: user.activity_level,
        bmr,
        tdee,
    })
}

#[derive(Serialize)]
pub struct WeightHistoryEntry {
    pub date: DateTime<Utc>,
    pub weight_kg: f64,
}

pub async fn get_weight_history(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<Vec<WeightHistoryEntry>> {
    let history = sqlx::query_as!(
        WeightLog,
        "SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY logged_at ASC",
        user_id
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    let res = history.iter().map(|h| WeightHistoryEntry {
        date: h.logged_at,
        weight_kg: h.weight_kg,
    }).collect();

    Json(res)
}

#[derive(Deserialize)]
pub struct LogNutritionRequest {
    pub calories_in: i32,
    pub protein_g: Option<i32>,
    pub carbs_g: Option<i32>,
    pub fats_g: Option<i32>,
}

pub async fn log_nutrition(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<LogNutritionRequest>,
) -> Json<NutritionLog> {
    let today = Utc::now().date_naive();
    
    // Log entry (Upsert logic could be better, but insert helps for now)
    // Postgres ON CONFLICT needed for pure upsert, or just check existing.
    // For simplicity, let's just insert/update for today.
    
    let log = sqlx::query_as!(
        NutritionLog,
        r#"
        INSERT INTO nutrition_logs (user_id, log_date, calories_in, protein_g, carbs_g, fats_g)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, log_date) 
        DO UPDATE SET 
            calories_in = nutrition_logs.calories_in + EXCLUDED.calories_in,
            protein_g = COALESCE(nutrition_logs.protein_g, 0) + COALESCE(EXCLUDED.protein_g, 0),
            carbs_g = COALESCE(nutrition_logs.carbs_g, 0) + COALESCE(EXCLUDED.carbs_g, 0),
            fats_g = COALESCE(nutrition_logs.fats_g, 0) + COALESCE(EXCLUDED.fats_g, 0)
        RETURNING *
        "#,
        user_id,
        today,
        payload.calories_in,
        payload.protein_g,
        payload.carbs_g,
        payload.fats_g
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(log)
}

pub async fn get_nutrition_log(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<Option<NutritionLog>> {
    let today = Utc::now().date_naive();
    let log = sqlx::query_as!(
        NutritionLog,
        "SELECT * FROM nutrition_logs WHERE user_id = $1 AND log_date = $2",
        user_id,
        today
    )
    .fetch_optional(&state.db)
    .await
    .unwrap();

    Json(log)
}
