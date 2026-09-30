# Shorui

By [ferdyhape](https://ferdyhape.com).

Dashboard of document tools. React frontend, FastAPI backend. All processing runs in the backend.

## Run

```bash
./dev.sh
```

Installs dependencies on first run, then starts the backend (`:8000`, API docs at `/docs`) and the
frontend (Vite, `:5173`, proxies `/api` to the backend). Ctrl+C stops both.
Override ports with `BACKEND_PORT` / `FRONTEND_PORT`.

## Checks

```bash
cd backend  && .venv/Scripts/python -m pytest && .venv/Scripts/python -m ruff check . && .venv/Scripts/python -m mypy app
cd frontend && npm run check      # typecheck + lint + design-token check + tests + format check
```

## Project docs for contributors and agents

`CLAUDE.md` (root), `backend/CLAUDE.md`, `frontend/CLAUDE.md`: commands, layout, rules, gotchas.
The UI mirrors Kagami's design system; tokens live in `frontend/src/styles/tokens.css`.

## Layout

```
backend/app/
  core/          config (env-driven), errors, upload safety, middleware
  tools/<name>/  router.py (HTTP only) · schemas.py · service code (no HTTP)
frontend/src/
  api/           typed fetch client (ApiError, AbortSignal)
  components/    shared UI (Banner, FileDropzone, ErrorBoundary)
  tools/<name>/  one folder per tool: container, hook + pure reducer, step components
```

## Add a tool

1. Backend: `backend/app/tools/<name>/` with a `router.py`; register it in `backend/app/main.py`.
2. Frontend: `frontend/src/tools/<name>/`; add an entry to `frontend/src/tools.ts`.

## Configuration (backend)

Env vars prefixed `SHORUI_` or a `backend/.env`: `MAX_UPLOAD_MB` (20), `MAX_UNCOMPRESSED_MB` (100),
`MAX_ROWS` (1000), `MAX_COLUMNS`, `MAX_CELL_CHARS`, `CORS_ORIGINS` (JSON list), `LOG_LEVEL`.

## Text Replacer

Upload a `.docx` with `{{variable}}` placeholders. Enter rows by hand or import CSV/XLSX
(header row = variable names, matched case-insensitively). One document per row; a zip
when more than one. Output name: `<value of chosen key>_<template name>.docx`.
Placeholders in body, tables, text boxes, headers and footers are replaced, including ones Word
split across runs. Missing values become empty; newlines in values become line breaks.
The UI offers a downloadable sample template and matching CSV (`backend/app/tools/text_replacer/samples/`,
regenerate with `backend/scripts/build_sample_template.py`).
