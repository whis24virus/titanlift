use sqlx::postgres::PgPoolOptions;
use std::env;
use dotenvy::dotenv;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new().connect(&database_url).await.expect("Failed to connect");
    sqlx::migrate!().run(&pool).await.expect("Failed to run migrations");
    println!("Migrations applied successfully!");
}
