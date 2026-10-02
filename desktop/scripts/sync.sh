#!/usr/bin/env bash
# Rebuilds the two artifacts `tauri build`/`tauri dev` consume, from the *current* state of
# ../backend and ../frontend. Run this after a feature lands on the web app, before packaging a
# new desktop build. Never edits backend/ or frontend/ - purely reads and copies their output.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROOT_WIN="$(cd "$ROOT" && pwd -W)" # Windows-style (D:/...) - PyInstaller's --add-data needs this,
                                   # not the posix-style $ROOT, or it resolves paths relative to
                                   # its own workdir instead of this one.
DESKTOP="$ROOT/desktop"
PORT=47821 # must match desktop/backend_entry.py and desktop/src-tauri/src/main.rs

# --- 1. frontend: production build, desktop tool set, API base baked in ---
echo "[sync] building frontend (VITE_TARGET=desktop)"
(
  cd "$ROOT/frontend"
  VITE_TARGET=desktop VITE_API_BASE="http://127.0.0.1:$PORT/api/v1" npm run build
)
rm -rf "$DESKTOP/src-tauri/dist-frontend"
cp -r "$ROOT/frontend/dist" "$DESKTOP/src-tauri/dist-frontend"

# --- 2. backend: one self-contained exe via PyInstaller, using the web venv's own deps ---
BACKEND_PY="$ROOT/backend/.venv/Scripts/python"
[ -x "$BACKEND_PY" ] || BACKEND_PY="$ROOT/backend/.venv/bin/python"
"$BACKEND_PY" -m PyInstaller --version >/dev/null 2>&1 || "$BACKEND_PY" -m pip install -q pyinstaller

echo "[sync] building backend (PyInstaller, onedir)"
rm -rf "$DESKTOP/build-tmp" "$DESKTOP/src-tauri/binaries/shorui-backend" "$DESKTOP/src-tauri/binaries/backend"

# Downloadable sample files aren't Python code, so PyInstaller won't pick them up on its own -
# one --add-data per tool that has a samples/ dir (docx-to-pdf excluded: not in the desktop build).
SAMPLE_DIRS=(text_replacer pdf_tools bulk_replace docx_cleaner pdf_compress image_to_pdf)
ADD_DATA=()
for name in "${SAMPLE_DIRS[@]}"; do
  ADD_DATA+=(--add-data "$ROOT_WIN/backend/app/tools/$name/samples;app/tools/$name/samples")
done

"$BACKEND_PY" -m PyInstaller \
  --noconfirm \
  --onedir \
  --name shorui-backend \
  --paths "$ROOT/backend" \
  --collect-all uvicorn \
  --collect-all fastapi \
  --collect-all multipart \
  "${ADD_DATA[@]}" \
  --distpath "$DESKTOP/src-tauri/binaries" \
  --workpath "$DESKTOP/build-tmp/work" \
  --specpath "$DESKTOP/build-tmp" \
  "$DESKTOP/backend_entry.py"

# main.rs looks for binaries/backend/shorui-backend(.exe); PyInstaller's --name only names the exe,
# the onedir folder is named after it too - rename so the resource path is the stable "backend".
mv "$DESKTOP/src-tauri/binaries/shorui-backend" "$DESKTOP/src-tauri/binaries/backend"

echo "[sync] done: $DESKTOP/src-tauri/dist-frontend, $DESKTOP/src-tauri/binaries/backend"
