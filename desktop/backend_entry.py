"""PyInstaller entrypoint for the desktop-bundled backend.

Runs the exact same FastAPI app as `uvicorn app.main:app` does for web dev (see ../dev.sh) - the
only difference from the dev command is the fixed port, no --reload, and no shell around it (this
*is* the process; `desktop/src-tauri/src/main.rs` spawns it directly and kills it on window close).

`desktop/scripts/sync.sh` builds this with:
    pyinstaller --onedir --name shorui-backend --distpath <dist> backend_entry.py
run with the repo's `backend/` on PYTHONPATH (see that script for the exact invocation).
"""

import uvicorn

from app.main import app

# Must match `BACKEND_PORT` in desktop/src-tauri/src/main.rs and the `VITE_API_BASE` baked in by
# desktop/scripts/sync.sh - all three have to agree on one number since it's fixed, not dynamic.
PORT = 47821

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
