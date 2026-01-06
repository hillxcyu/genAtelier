#!/bin/bash

# Start the Python Brand Analysis Service in the background
echo "Starting Python Brand Analysis Service..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!

# Start the Node.js Gateway
echo "Starting Node.js Gateway..."
cd /app
node dist-server/index.js &
NODE_PID=$!

# Function to handle termination signals
term_handler() {
  echo "Terminating services..."
  kill -SIGTERM "$PYTHON_PID"
  kill -SIGTERM "$NODE_PID"
  wait "$PYTHON_PID"
  wait "$NODE_PID"
  exit 0
}

# Trap SIGTERM and SIGINT
trap term_handler SIGTERM SIGINT

# Wait for processes to exit
wait -n "$PYTHON_PID" "$NODE_PID"

# Exit with the status of the process that failed first
exit $?
