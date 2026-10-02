#!/usr/bin/env bash
# Produces the installer: syncs the latest web build in, then runs `tauri build`.
# Needs Rust (rustup) and Node installed; see ../README.md for first-time setup.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DESKTOP="$ROOT/desktop"
source "$DESKTOP/scripts/_toolchain.sh"

"$DESKTOP/scripts/sync.sh"

cd "$DESKTOP"
[ -d node_modules ] || npm install
npx tauri build

echo "[build] installer(s) under: $DESKTOP/src-tauri/target/release/bundle/"
