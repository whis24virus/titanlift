use axum::{
    extract::{State, Path},
    Json,
};
use crate::{AppState, models::User};
use serde::Serialize;
use uuid::Uuid;
use sqlx::FromRow;
use chrono::{DateTime, Utc, NaiveDate};

#[derive(Serialize)]
pub struct DailyActivity {
    pub date: String,
    pub volume_kg: f64,
}

#[derive(Serialize)]
pub struct WorkoutHistoryEntry {
    pub id: Uuid,
    pub name: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub total_volume_kg: f64,
    pub exercise_count: i64,
}

#[derive(Serialize)]
pub struct UserProfile {
    pub username: String,
    pub total_workouts: i64,
    pub total_volume_kg: f64,
    pub join_date: DateTime<Utc>,
    pub activity_log: Vec<DailyActivity>,
    pub current_streak: i64,
    pub max_streak: i64,
}

#[derive(Serialize, FromRow)]
pub struct LeaderboardEntry {
    pub username: String,
    pub total_volume_kg: Option<f64>,
    pub rank: Option<i64>,
}

pub async fn get_profile(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<UserProfile> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        user_id
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    // Fetch basic stats
    let stats = sqlx::query!(
        r#"
        SELECT
            COUNT(DISTINCT w.id) as workout_count,
            COALESCE(SUM(s.weight_kg * s.reps), 0) as total_volume
        FROM workouts w
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.user_id = $1
        "#,
        user_id
    )
    .fetch_one(&state.db)
    .await
    .unwrap();

    // Fetch daily activity for the last 365 days
    let activity = sqlx::query!(
        r#"
        SELECT
            DATE(w.start_time) as work_date,
            COALESCE(SUM(s.weight_kg * s.reps), 0) as daily_volume
        FROM workouts w
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.user_id = $1 AND w.start_time > NOW() - INTERVAL '1 year'
        GROUP BY work_date
        ORDER BY work_date ASC
        "#,
        user_id
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    let activity_log: Vec<DailyActivity> = activity.iter().map(|rec| DailyActivity {
        date: rec.work_date.map(|d| d.to_string()).unwrap_or_default(),
        volume_kg: rec.daily_volume.unwrap_or(0.0),
    }).collect();

    // Calculate streaks (simplified logic)
    let mut current_streak = 0;
    let mut max_streak = 0;
    let mut temp_streak = 0;
    let mut last_date: Option<NaiveDate> = None;
    
    // Sort activity by date just to be safe
    let mut sorted_dates: Vec<NaiveDate> = activity.iter()
        .filter_map(|r| r.work_date)
        .collect();
    sorted_dates.sort();
    sorted_dates.dedup(); // Remove multiple workouts on same day

    for date in sorted_dates {
        if let Some(prev) = last_date {
            let diff = date.signed_duration_since(prev).num_days();
            if diff == 1 {
                temp_streak += 1;
            } else {
                temp_streak = 1;
            }
        } else {
            temp_streak = 1;
        }
        
        if temp_streak > max_streak {
            max_streak = temp_streak;
        }
        last_date = Some(date);
    }
    
    // Check if current streak is active (today or yesterday)
    let today = Utc::now().date_naive();
    if let Some(last) = last_date {
        let diff = today.signed_duration_since(last).num_days();
        if diff <= 1 {
            current_streak = temp_streak;
        } else {
            current_streak = 0;
        }
    }

    Json(UserProfile {
        username: user.username,
        total_workouts: stats.workout_count.unwrap_or(0),
        total_volume_kg: stats.total_volume.unwrap_or(0.0),
        join_date: user.created_at,
        activity_log,
        current_streak,
        max_streak,
    })
}

pub async fn get_leaderboard(
    State(state): State<AppState>,
) -> Json<Vec<LeaderboardEntry>> {
    let leaderboard = sqlx::query_as!(
        LeaderboardEntry,
        r#"
        SELECT 
            u.username,
            COALESCE(SUM(s.weight_kg * s.reps), 0) as total_volume_kg,
            RANK() OVER (ORDER BY SUM(s.weight_kg * s.reps) DESC)::BIGINT as rank
        FROM users u
        LEFT JOIN workouts w ON u.id = w.user_id
        LEFT JOIN sets s ON w.id = s.workout_id
        GROUP BY u.id, u.username
        ORDER BY total_volume_kg DESC
        LIMIT 10
        "#
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    Json(leaderboard)
}

pub async fn get_workout_history(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Json<Vec<WorkoutHistoryEntry>> {
    let history = sqlx::query!(
        r#"
        SELECT 
            w.id,
            w.name,
            w.start_time,
            w.end_time,
            COALESCE(SUM(s.weight_kg * s.reps), 0) as total_volume,
            COUNT(DISTINCT s.exercise_id) as exercise_count
        FROM workouts w
        LEFT JOIN sets s ON w.id = s.workout_id
        WHERE w.user_id = $1 AND w.end_time IS NOT NULL
        GROUP BY w.id
        ORDER BY w.start_time DESC
        LIMIT 20
        "#,
        user_id
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or(vec![]);

    let response = history.iter().map(|rec| WorkoutHistoryEntry {
        id: rec.id,
        name: rec.name.clone(),
        start_time: rec.start_time.unwrap_or(Utc::now()), // Should always have start time
        end_time: rec.end_time,
        total_volume_kg: rec.total_volume.unwrap_or(0.0),
        exercise_count: rec.exercise_count.unwrap_or(0),
    }).collect();

    Json(response)
}
