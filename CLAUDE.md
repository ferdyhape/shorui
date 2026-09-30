# Shorui

Dashboard of document tools. React frontend + FastAPI backend. All document processing runs in the
backend; the frontend only collects input and shows results. First tool: **Text Replacer**
(mail-merge for `.docx`: `{{variable}}` placeholders + rows of data, one output document per row).

Read this file first. Deeper rules live in [backend/CLAUDE.md](backend/CLAUDE.md) and
[frontend/CLAUDE.md](frontend/CLAUDE.md). You should not need to explore the code to start working.

## Commands

```bash
./dev.sh                       # backend :8000 + frontend :5173 (Vite picks the next port if busy); Ctrl+C stops both
# backend (from backend/)
.venv/Scripts/python -m pytest
.venv/Scripts/python -m ruff check . --exclude .venv && .venv/Scripts/python -m ruff format . --exclude .venv
.venv/Scripts/python -m mypy app
# frontend (from frontend/)
npm run check                  # typecheck + oxlint + design-token check + vitest + prettier check
npm run format                 # prettier --write
```

Definition of done for any change: backend `pytest` + `ruff check` + `mypy app` pass, and frontend
`npm run check` passes. Add or update tests with the change. Do not report done without running them.

## Layout

```
dev.sh                         one-command dev runner
backend/app/
  main.py                      create_app(): CORS, middleware, error handler, /api/v1 router registry
  core/                        config (pydantic-settings, SHORUI_* env), errors, uploads, middleware
  tools/<name>/                one folder per tool: router.py (HTTP only), schemas.py, service code
  tools/text_replacer/samples/ downloadable sample template.docx + data.csv (generated, see below)
backend/scripts/               build_sample_template.py (regenerates the samples)
backend/tests/                 pytest; conftest.py has client/settings/template fixtures
frontend/src/
  styles/tokens.css            design tokens (mirrored from Kagami) - single source of truth
  index.css                    Tailwind v4 + fonts + base styles
  components/core|navigation/  Button, Card, Select, Icon, Sidebar, PageHeader, ThemeToggle
  components/                  Banner, FileDropzone, ErrorBoundary (shared)
  api/                         typed fetch client (ApiError, AbortSignal) + per-tool API modules
  tools.ts                     tool registry: sidebar entries and routes come from here
  tools/<name>/                one folder per tool
```

## Cross-cutting rules

- **Language:** the user chats in Indonesian. Code, comments, docs, commit messages: English.
- **Quality bar:** the user wants production-grade code, not just working code. Follow the layering
  and conventions below; do not take shortcuts to make something "just work".
- **API:** all endpoints under `/api/v1`. Errors are `{"detail": str, "code": str}`. The frontend
  reads `detail` and shows it to the user, so write `detail` for humans.
- **Privacy:** never log request bodies, file names or cell values. Uploads can contain personal data.
- **Limits:** every upload/row/column/cell count has a configured limit (`core/config.py`); the
  frontend mirrors the two it needs (`frontend/src/lib/limits.ts`). Change both when you change a default.
- **Design:** UI must match Kagami (`D:\Research\FunkyAI\kagami\web\frontend-v1`). Use tokens only;
  see frontend/CLAUDE.md.
- **Dependencies:** prefer what is already installed. Pin nothing exotic; ask before adding a heavy one.

## Add a tool (checklist)

1. Backend: `backend/app/tools/<name>/` with `router.py` (thin), `schemas.py`, service module(s).
   Register the router in `backend/app/main.py` under the `v1` router. Raise domain errors from
   `core/errors.py`, never `HTTPException` in services. Add tests in `backend/tests/`.
2. Frontend: `frontend/src/tools/<name>/` (container, `use<Name>` hook + pure reducer, step
   components), `frontend/src/api/<name>.ts`, then add an entry (id, name, description, icon,
   lazy component) to `frontend/src/tools.ts`. If the icon is new, add it to `components/core/Icon.tsx`.
3. Update the README "Layout"/tool notes if structure changed; keep this file accurate.

## Text Replacer (domain facts)

- Placeholder syntax `{{variable}}`; regex `\{\{\s*([^{}]+?)\s*\}\}`. Names are case-sensitive and
  trimmed; `{{ name }}` and `{{name}}` are the same variable.
- Word splits placeholders across runs (`<w:t>`). `docx_service` matches on the joined paragraph
  text and writes the value into the first touched node (first run's formatting wins). Never
  replace this with per-run string replace.
- Covered: body, nested tables, text boxes, headers, footers. Not covered: footnotes, endnotes,
  comments, images, charts. Keep the template guide (`TemplateGuide.tsx`) in sync with this.
- Missing variable or empty cell becomes an empty string. Illegal XML control characters are stripped
  (else lxml raises). `\n` in a value becomes `<w:br/>`.
- Output naming: `<value of chosen key>_<template stem>.docx`; empty value -> `row<N>`; case-insensitive
  duplicates get `-2`, `-3`. No key -> `<stem>_<N>.docx`. One row -> a `.docx`; several -> `text-replacer_<template stem>.zip`
  (`<tool slug>_<template stem>`).
  The frontend `previewFileName` mirrors this rule for the preview only; the backend is authoritative.
- Endpoints: `POST /extract`, `POST /parse-table` (csv/xlsx), `POST /generate` (streams the file),
  `GET /samples/{template.docx|data.csv}`.
- Samples: edit `backend/scripts/build_sample_template.py`, run
  `cd backend && PYTHONPATH=. .venv/Scripts/python scripts/build_sample_template.py`, commit both
  generated files. `tests/test_samples.py` fails if the CSV header and template variables drift.

## Gotchas (learned the hard way)

- The Bash tool breaks on heredocs containing quote-heavy TSX/JSX (`unexpected EOF`). Use the Write
  tool for source files. Do not run parallel Bash calls that each `cd` (they race on the working dir).
- Port 5173 on the user's machine is usually taken by the Kagami dev server. Test on another port,
  e.g. `FRONTEND_PORT=5199 BACKEND_PORT=8011 ./dev.sh`, and stop the servers afterwards.
- The frontend `tsconfig` has `strict`, `noUncheckedIndexedAccess` and `erasableSyntaxOnly`: no class
  parameter properties, no enums; index access returns `T | undefined`.
- `lucide-react` is v1.x here (Kagami uses 0.454). Check an icon exists before adding it.
- python-docx has no useful type stubs; XML-level code is typed `Any` on purpose.
- `TestClient` warns about `httpx` deprecation; already filtered in `pyproject.toml`.
- LibreOffice is at `C:\Program Files\LibreOffice\program\soffice.exe`; use
  `--headless --convert-to png` to eyeball a generated docx.
