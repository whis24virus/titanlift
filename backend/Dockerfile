# Stage 1: Compute a recipe file for dependencies
FROM rust:1.81-slim-bullseye AS planner
WORKDIR /app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 2: Cache and build dependencies
FROM rust:1.81-slim-bullseye AS cacher
WORKDIR /app
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching layer!
RUN cargo chef cook --release --bin backend --recipe-path recipe.json

# Stage 3: Build the application
FROM rust:1.81-slim-bullseye AS builder
WORKDIR /app
COPY . .
# Copy over the cached dependencies
COPY --from=cacher /app/target target
COPY --from=cacher /usr/local/cargo /usr/local/cargo
RUN cargo build --release --bin backend

# Stage 4: Runtime environment
FROM debian:bullseye-slim AS runtime
WORKDIR /app
# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/backend /usr/local/bin/backend
COPY --from=builder /app/migrations ./migrations

# Expose the API port
EXPOSE 3000

CMD ["/usr/local/bin/backend"]
