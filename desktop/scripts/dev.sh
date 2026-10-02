#!/usr/bin/env bash
# Previews the desktop shell against the *existing* web dev server - no PyInstaller/installer
# build needed for this. Start `../dev.sh` in another terminal first (plain `uvicorn --reload` +
# Vite, both on their normal web ports); this just points Tauri's window at the Vite dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DESKTOP="$ROOT/desktop"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

if ! curl -s -o /dev/null "http://127.0.0.1:$FRONTEND_PORT"; then
  echo "[dev] nothing answering on http://127.0.0.1:$FRONTEND_PORT" >&2
  echo "[dev] start the web app first: ../dev.sh (or FRONTEND_PORT=$FRONTEND_PORT ../dev.sh)" >&2
  exit 1
fi

cd "$DESKTOP"
[ -d node_modules ] || npm install
# devUrl overrides tauri.conf.json's frontendDist for this run only - no dist-frontend/ needed.
TAURI_DEV_URL="http://127.0.0.1:$FRONTEND_PORT" npx tauri dev
