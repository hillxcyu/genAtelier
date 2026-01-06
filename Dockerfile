# Unified Build Stage
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy AS builder

# Install Node.js 18
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install --force

# Install Python dependencies for backend
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy everything else
COPY . .

# Build frontend and Node server
RUN echo "Building frontend..." && npm run build
RUN echo "Building server..." && npm run build:server

# Production Stage
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# Install Node.js 18
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get install -y pkg-config python3-dev libcairo2-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install production Node dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps || npm install --omit=dev --force

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt
RUN playwright install chromium

# Copy builds from builder
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/start.sh ./start.sh

# Environment variables
ENV PORT=8080
ENV GEMINI_API_KEY=""
ENV GOOGLE_CLOUD_PROJECT=""
ENV GOOGLE_CLOUD_LOCATION="us-central1"

# Set permissions
RUN chmod +x /app/start.sh

EXPOSE 8080 8000

CMD ["/app/start.sh"]
