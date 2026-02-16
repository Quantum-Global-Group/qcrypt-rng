#!/bin/bash
set -e

echo "Starting QCrypt RNG on Hugging Face Spaces..."

# Start FastAPI backend
echo "  Starting FastAPI backend on :8000..."
cd /app
uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info &
FASTAPI_PID=$!

# Start Next.js frontend
echo "  Starting Next.js frontend on :3000..."
cd /app/quantum-oracle-ui
PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js &
NEXTJS_PID=$!

# Wait for services to be ready
echo "  Waiting for services..."
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo "  FastAPI is ready."
        break
    fi
    sleep 1
done

for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:3000 > /dev/null 2>&1; then
        echo "  Next.js is ready."
        break
    fi
    sleep 1
done

echo "  Starting Nginx on :7860..."
echo "  QCrypt RNG is live!"

# Start Nginx in foreground (keeps container running)
nginx -g 'daemon off;'
