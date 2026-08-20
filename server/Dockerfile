# === Build Stage ===
FROM rust:1.85-slim AS builder

WORKDIR /app

# Install build dependencies for rusqlite (bundled sqlite3)
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files first for dependency caching
COPY Cargo.toml Cargo.lock ./

# Dummy main for layer caching
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/novel_server*

# Copy real source
COPY src ./src

# Build final release binary
RUN cargo build --release

# === Runtime Stage ===
FROM debian:bookworm-slim

WORKDIR /app

# Runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/novel-server /app/novel-server

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# Run server
CMD ["/app/novel-server"]
