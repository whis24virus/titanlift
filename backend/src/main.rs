use axum::{
    routing::get,
    Router,
    extract::State,
};
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::sync::Arc;
use dotenvy::dotenv;
use std::env;

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

mod models;
mod handlers;


#[tokio::main]
async fn main() {
    dotenv().ok();
    
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Connect to database
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = AppState { db: pool };

    // build our application
    let app = Router::new()
        .route("/", get(root))
        .route("/api/exercises", get(handlers::exercises::list_exercises))
        .route("/api/workouts", axum::routing::post(handlers::workouts::create_workout))
        .route("/api/sets", axum::routing::post(handlers::workouts::log_set).get(handlers::workouts::list_sets))
        .route("/api/templates", axum::routing::get(handlers::templates::list_templates).post(handlers::templates::create_template))
        .route("/api/templates/:id", axum::routing::get(handlers::templates::get_template))
        .route("/api/templates/:id/exercises", axum::routing::post(handlers::templates::add_template_exercise).put(handlers::templates::update_template_exercises))
        .route("/api/workouts/:id/finish", axum::routing::post(handlers::workouts::finish_workout))
        .route("/api/profile/:id", axum::routing::get(handlers::social::get_profile))
        .route("/api/profile/:id/history", axum::routing::get(handlers::social::get_workout_history))
        .route("/api/profile/:id/stats", axum::routing::get(handlers::profile::get_physical_stats).post(handlers::profile::update_physical_stats))
        .route("/api/profile/:id/weight", axum::routing::get(handlers::profile::get_weight_history))
        .route("/api/profile/:id/nutrition", axum::routing::get(handlers::profile::get_nutrition_log).post(handlers::profile::log_nutrition))
        .route("/api/leaderboard", axum::routing::get(handlers::social::get_leaderboard))
        .route("/api/profile/:id/badges", axum::routing::get(handlers::gamification::get_user_badges))

        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // run it
    // run it
    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string()).parse().expect("PORT must be a number");
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// basic handler
async fn root() -> &'static str {
    "TitanLift Backend is Running with SQLx!"
}
