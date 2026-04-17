#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# QCrypt RNG — unified startup (Fly.io + Hugging Face Spaces compatible)
#
# Start order:
#   1. Nginx immediately (port 7860) — Fly health-checks pass as soon as it's up
#   2. FastAPI (port 8000) — background, auto-restarts on crash
#   3. Next.js (port 3000) — background, auto-restarts on crash
#   4. Watchdog loop keeps container alive and restarts crashed services
#
# Memory budget (shared-cpu-1x / 512 MB recommended):
#   nginx    ~  5 MB
#   uvicorn  ~100 MB  (1 worker)
#   node     ~150 MB
#   headroom ~ 257 MB
# ──────────────────────────────────────────────────────────────────────────────

SHUTDOWN=0

_shutdown() {
  echo "[shutdown] SIGTERM received — stopping services…"
  SHUTDOWN=1
  nginx -s quit 2>/dev/null || true
  kill "$FASTAPI_PID" "$NEXTJS_PID" 2>/dev/null || true
  wait "$FASTAPI_PID" "$NEXTJS_PID" 2>/dev/null || true
  echo "[shutdown] Done."
  exit 0
}
trap _shutdown SIGTERM SIGINT

echo "[startup] QCrypt RNG initialising…"

# ── 1. Nginx ──────────────────────────────────────────────────────────────────
echo "[startup] Starting Nginx on :7860…"
nginx   # runs as daemon; reads /etc/nginx/nginx.conf → nginx.spaces.conf

# ── 2. FastAPI backend (with auto-restart) ────────────────────────────────────
_start_fastapi() {
  cd /app
  uvicorn app.main:app \
      --host 127.0.0.1 \
      --port 8000 \
      --workers 1 \
      --log-level info &
  FASTAPI_PID=$!
  echo "[startup] FastAPI PID $FASTAPI_PID"
}

# ── 3. Next.js frontend (with auto-restart) ───────────────────────────────────
_start_nextjs() {
  cd /app/quantum-oracle-ui
  PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js &
  NEXTJS_PID=$!
  echo "[startup] Next.js PID $NEXTJS_PID"
}

_start_fastapi
_start_nextjs

# ── 4. Log when each service first becomes healthy ────────────────────────────
(
  for i in $(seq 1 90); do
    curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1 && \
      echo "[startup] FastAPI healthy after ${i}s" && break
    sleep 1
  done
) &

(
  for i in $(seq 1 90); do
    curl -sf http://127.0.0.1:3000 > /dev/null 2>&1 && \
      echo "[startup] Next.js healthy after ${i}s" && break
    sleep 1
  done
) &

echo "[startup] QCrypt RNG is live!"

# ── 5. Watchdog — restart crashed services, keep container alive ──────────────
while [ "$SHUTDOWN" -eq 0 ]; do
  sleep 5

  if [ "$SHUTDOWN" -eq 1 ]; then break; fi

  # Check FastAPI
  if ! kill -0 "$FASTAPI_PID" 2>/dev/null; then
    echo "[watchdog] FastAPI (PID $FASTAPI_PID) exited — restarting…"
    _start_fastapi
  fi

  # Check Next.js
  if ! kill -0 "$NEXTJS_PID" 2>/dev/null; then
    echo "[watchdog] Next.js (PID $NEXTJS_PID) exited — restarting…"
    _start_nextjs
  fi
done
