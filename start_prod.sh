#!/bin/bash
set -e

# Port configuration
# Cloud Run sets the PORT env var. Usually 8080.
LISTEN_PORT=${PORT:-8080}
BACKEND_PORT=8000

echo "🚀 Starting Backend (FastAPI) on port $BACKEND_PORT..."
cd /app/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

echo "⚛️ Starting Frontend (Next.js) on port $LISTEN_PORT..."
cd /app/frontend
# Next.js responds to PORT for 'npm run start'
export PORT=$LISTEN_PORT
npm run start &
FRONTEND_PID=$!

echo "✅ Services started. Backend: $BACKEND_PID, Frontend: $FRONTEND_PID"

# Wait for any process to exit
wait -n

# Exit with status of the child that exited first
exit $?
