# Build Stage
FROM rust:1.80 as builder

WORKDIR /usr/src/app

# install sqlx-cli for checking/preparing if needed (optional, using offline mode mainly)
# but we need to ensure dependencies are installed

# 1. Create a dummy project to cache dependencies
RUN mkdir src
# Create a dummy main.rs to allow cargo build to run and cache dependencies
RUN echo "fn main() {}" > src/main.rs

COPY Cargo.toml Cargo.lock ./

# SQLx offline mode requires these
# We will copy the specific json file later, but for dependency build we don't need it yet.
# However, sqlx macros might trigger.
# To safely cache deps, we remove the sqlx-data.json requirement temporarily or just build deps.
RUN cargo build --release || true 
# The above build might fail if sqlx macros run on dummy main (unlikely) or if lib.rs exists (we didn't copy it).
# Actually, just building deps:
RUN rm -rf src

# 2. Copy actual source code
COPY src ./src
COPY migrations ./migrations
COPY .sqlx ./.sqlx

# 3. Build the actual application
# key: Enable offline mode
ENV SQLX_OFFLINE=true
RUN cargo build --release

# Runtime Stage
FROM debian:bookworm-slim

# Install runtime dependencies (OpenSSL, etc.)
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# Copy the binary from builder
COPY --from=builder /usr/src/app/target/release/backend .

# Copy environment file example if needed, strictly speaking we use docker env vars
# COPY .env .env 

EXPOSE 3000

CMD ["./backend"]
