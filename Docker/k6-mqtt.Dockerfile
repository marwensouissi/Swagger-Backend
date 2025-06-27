# Stage 1: Build k6 with plugins
FROM golang:1.24 AS builder

# Set up webhook ffffff


# Install dependencies
RUN go install go.k6.io/xk6/cmd/xk6@latest

# Set working directory 

WORKDIR /build

# Build K6 with MQTT & File plugins
RUN /go/bin/xk6 build v0.54.0 \
    --with github.com/pmalhaire/xk6-mqtt@latest \
    --with github.com/avitalique/xk6-file@latest \
    --with github.com/grafana/xk6-dashboard@latest \
    --with github.com/grafana/xk6-output-prometheus-remote@latest\
    --output k6

# Stage 2: Create lightweight runtime environment
FROM alpine:latest

# Install required dependencies
RUN apk add --no-cache ca-certificates

# Copy the built K6 binary from builder stage
COPY --from=builder /build/k6 /usr/local/bin/k6
WORKDIR /app
ENTRYPOINT ["k6"]