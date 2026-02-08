# Composite Dockerfile for Single-Container Deployment
# 1. Build Frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app-frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# 2. Build Backend
FROM rust:1.80 as backend-builder
WORKDIR /usr/src/app
RUN mkdir src && echo "fn main() {}" > src/main.rs
COPY backend/Cargo.toml ./
# Copy lock file if it exists (using wildcard trick or just direct copy if we are sure)
COPY backend/Cargo.lock* ./
COPY backend/.sqlx ./.sqlx
# Enable offline mode for sqlx
ENV SQLX_OFFLINE=true
RUN cargo build --release || true
RUN rm -rf src

COPY backend/src ./src
COPY backend/migrations ./migrations
# We also need to copy the compiled frontend assets if we want to serve them
# BUT backend currently doesn't have static file serving configured in main.rs
# So for now, this Dockerfile defines the BACKEND service primarily.
RUN cargo build --release

# 3. Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/local/bin
COPY --from=backend-builder /usr/src/app/target/release/backend .
# Optional: If we change backend to serve static files, we'd copy them here.
# COPY --from=frontend-builder /app-frontend/dist ./static

EXPOSE 3000
CMD ["./backend"]
