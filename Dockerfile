# ---------------- Stage 1: Install dependencies and build custom k6 ----------------
    FROM golang:1.24 AS k6-builder

    # Install xk6 (Custom K6 with plugins)
    RUN go install go.k6.io/xk6/cmd/xk6@latest
    
    # Set working directory
    WORKDIR /build
    
    # Build custom k6 binary with plugins
    RUN /go/bin/xk6 build v0.54.0 \
        --with github.com/pmalhaire/xk6-mqtt@latest \
        --with github.com/avitalique/xk6-file@latest \
        --with github.com/grafana/xk6-dashboard@latest \
        --with github.com/grafana/xk6-output-prometheus-remote@latest \
        --output /build/k6
    
    # ---------------- Stage 2: Install Python and Jinja2 ----------------
    FROM python:3.10-slim AS python-builder
    
    # Install Jinja2
    RUN pip install --no-cache-dir jinja2
    
    # ---------------- Stage 3: Create lightweight runtime environment ----------------
    FROM debian:bullseye-slim
    
    # Install minimal required system dependencies
    RUN apt-get update && apt-get install -y --no-install-recommends \
                    python3 \
                    python3-pip \
                    bash \
                    ca-certificates \
                && apt-get clean && rm -rf /var/lib/apt/lists/*
    
    # Copy pip from python-builder
    COPY --from=python-builder /usr/local/bin/pip /usr/local/bin/pip
    
    # Install Jinja2 in the final image
    RUN pip install --no-cache-dir jinja2
    
    # Set working directory
    WORKDIR /app
    
    # Copy jinja/ directory from build context to /app/jinja/ inside the container
    COPY ../k6/jinja/ /app/k6/jinja/
    
    # Copy the custom k6 binary from the k6-builder stage
    COPY --from=k6-builder /build/k6 /usr/local/bin/k6
    
    # Make sure the generated test file will be saved to the mounted directory
    WORKDIR /app
    
    # Default command: Allow running Python scripts or k6 commands
    CMD ["python3"]
    