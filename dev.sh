#!/usr/bin/env bash
# Start backend (FastAPI) and frontend (Vite) together. Ctrl+C stops both.
# Usage: ./dev.sh            (BACKEND_PORT=8000 FRONTEND_PORT=5173 to override)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# --- backend: venv + deps (only when missing or requirements changed) ---
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  echo "[dev] creating backend venv"
  python -m venv .venv 2>/dev/null || python3 -m venv .venv
fi
if [ -x .venv/Scripts/python ]; then PY=".venv/Scripts/python"; else PY=".venv/bin/python"; fi
STAMP=".venv/.requirements-dev.stamp"
if [ ! -f "$STAMP" ] || [ requirements-dev.txt -nt "$STAMP" ] || [ requirements.txt -nt "$STAMP" ]; then
  echo "[dev] installing backend dependencies"
  "$PY" -m pip install -q -r requirements-dev.txt
  touch "$STAMP"
fi

# --- frontend: node_modules ---
cd "$ROOT/frontend"
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "[dev] installing frontend dependencies"
  npm install
fi

# --- run both; kill the whole process group on exit ---
cleanup() {
  trap - EXIT INT TERM
  echo; echo "[dev] stopping..."
  kill 0 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[dev] backend  -> http://127.0.0.1:${BACKEND_PORT}  (docs: /docs)"
(cd "$ROOT/backend" && exec "$PY" -m uvicorn app.main:app --reload --port "$BACKEND_PORT") &

echo "[dev] frontend starting (Vite prints its URL; it picks the next port if ${FRONTEND_PORT} is busy)"
(cd "$ROOT/frontend" && BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}" exec npm run dev -- --port "$FRONTEND_PORT") &

# Exit as soon as either server dies, so a crash is not hidden by the other one.
wait -n
