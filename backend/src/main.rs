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
pub struct AppState {
    pub db: PgPool,
}

mod models;
mod handlers;


#[tokio::main]
async fn main() {
    dotenv().ok();
    
    // Initialize tracing FIRST so we can see logs
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    println!("🚀 TitanLift Backend Starting...");
    tracing::info!("TitanLift Backend Starting...");

    // Get DATABASE_URL with explicit error message
    let database_url = match env::var("DATABASE_URL") {
        Ok(url) => {
            println!("✅ DATABASE_URL is set");
            tracing::info!("DATABASE_URL is set (length: {})", url.len());
            url
        }
        Err(_) => {
            println!("❌ DATABASE_URL is NOT set!");
            tracing::error!("DATABASE_URL environment variable is not set!");
            panic!("DATABASE_URL must be set");
        }
    };

    // Connect to database with retry logic
    println!("📡 Connecting to database...");
    tracing::info!("Connecting to database...");
    
    let pool = match PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(30))
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            println!("✅ Database connected successfully!");
            tracing::info!("Database connected successfully!");
            pool
        }
        Err(e) => {
            println!("❌ Failed to connect to database: {}", e);
            tracing::error!("Failed to connect to database: {}", e);
            panic!("Failed to connect to database: {}", e);
        }
    };

    // Run migrations with explicit error handling
    println!("🔄 Running database migrations...");
    tracing::info!("Running database migrations...");
    
    match sqlx::migrate!().run(&pool).await {
        Ok(_) => {
            println!("✅ Migrations completed successfully!");
            tracing::info!("Migrations completed successfully!");
        }
        Err(e) => {
            println!("❌ Failed to run migrations: {}", e);
            tracing::error!("Failed to run migrations: {}", e);
            tracing::warn!("⚠️ IGNORING MIGRATION ERROR - CONTINUING STARTUP");
            // panic!("Failed to run migrations: {}", e); 
        }
    }

    let state = AppState { db: pool };

    // build our application
    let app = Router::new()
        .route("/", get(root))
        .route("/api/exercises", get(handlers::exercises::list_exercises))
        .route("/api/workouts", axum::routing::post(handlers::workouts::create_workout))
        .route("/api/sets", axum::routing::post(handlers::workouts::log_set).get(handlers::workouts::list_sets))
        .route("/api/sets/:id", axum::routing::delete(handlers::workouts::delete_set))
        .route("/api/templates", axum::routing::get(handlers::templates::list_templates).post(handlers::templates::create_template))
        .route("/api/templates/:id", axum::routing::get(handlers::templates::get_template))
        .route("/api/templates/:id/exercises", axum::routing::post(handlers::templates::add_template_exercise).put(handlers::templates::update_template_exercises))
        .route("/api/workouts/:id/finish", axum::routing::post(handlers::workouts::finish_workout))
        .route("/api/workouts/active", axum::routing::get(handlers::workouts::get_active_workout))
        .route("/api/profile/:id", axum::routing::get(handlers::profile::get_full_profile))
        .route("/api/profile/:id/history", axum::routing::get(handlers::social::get_workout_history))
        .route("/api/profile/:id/stats", axum::routing::get(handlers::profile::get_physical_stats).post(handlers::profile::update_physical_stats))
        .route("/api/profile/:id/weight", axum::routing::get(handlers::profile::get_weight_history))
        .route("/api/profile/:id/nutrition", axum::routing::get(handlers::profile::get_nutrition_log).post(handlers::profile::log_nutrition))
        .route("/api/leaderboard", axum::routing::get(handlers::social::get_leaderboard))
        .route("/api/profile/:id/badges", axum::routing::get(handlers::gamification::get_user_badges))
        .route("/api/social/follow/:id", axum::routing::post(handlers::social::follow_user).delete(handlers::social::unfollow_user))
        .route("/api/social/profile", axum::routing::put(handlers::social::update_social_profile))
        .route("/api/social/profile/:id", axum::routing::get(handlers::social::get_profile))
        .route("/api/social/search", axum::routing::get(handlers::social::search_users))

        .layer(
            tower_http::cors::CorsLayer::new()
                .allow_origin(tower_http::cors::Any)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any),
        )
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
