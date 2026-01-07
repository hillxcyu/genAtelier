# Multi-stage build
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy AS builder

# Install Node.js 18
RUN apt-get update && apt-get install -y curl pkg-config python3-dev libcairo2-dev build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Frontend dependencies and build
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# Install Backend dependencies
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# Install Node.js 18 and build dependencies for Python packages (like pycairo)
RUN apt-get update && apt-get install -y curl pkg-config python3-dev libcairo2-dev build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Backend
COPY backend/ ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
RUN playwright install chromium

# Copy Frontend build and node_modules
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/next.config.js ./frontend/next.config.js

# Copy Startup script
COPY start_prod.sh .
RUN chmod +x start_prod.sh

EXPOSE 8080

CMD ["./start_prod.sh"]
