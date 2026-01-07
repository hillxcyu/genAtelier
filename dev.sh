#!/bin/bash

# Trap to kill all subprocesses on exit
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

echo "🚀 Starting Lookbook Reformatted..."

# 1. Backend Setup & Run
echo "🐍 Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    ./venv/bin/pip install --index-url https://pypi.org/simple -r requirements.txt
    ./venv/bin/playwright install chromium
fi

# Run Backend in background using venv python
./venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend running on port 8000 (PID: $BACKEND_PID)"

# 2. Frontend Run
echo "⚛️ Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on port 3000 (PID: $FRONTEND_PID)"

# Wait for both
wait
