#!/usr/bin/env bash
# ==============================================================================
# LEXIA — Start Script
# Runs both the FastAPI backend and Vite frontend together.
# ==============================================================================

set -e

# Change to the repository root directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "=========================================================="
echo "  LEXIA — AI Language Translation & Recognition System"
echo "=========================================================="

# 1. Setup backend if virtual environment doesn't exist
if [ ! -d "backend/.venv" ]; then
  echo "📦 Setting up Python virtual environment in backend/.venv..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install --upgrade pip
  backend/.venv/bin/pip install -r backend/requirements.txt
fi

# 2. Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend npm dependencies..."
  (cd frontend && npm install)
fi

echo ""
echo "🚀 Starting Backend on:  http://127.0.0.1:8000"
echo "🚀 Starting Frontend on: http://localhost:5173"
echo "👉 Open http://localhost:5173 in your browser"
echo "👉 Press CTRL+C to stop both servers"
echo "=========================================================="
echo ""

# Start Backend
backend/.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend &
BACKEND_PID=$!

# Start Frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "🛑 Stopping LEXIA servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID 2>/dev/null || true
  wait $FRONTEND_PID 2>/dev/null || true
  echo "✅ Done."
}

trap cleanup INT TERM EXIT

wait
