# Shorui

By [ferdyhape](https://ferdyhape.com).

Dashboard of document tools. React frontend, FastAPI backend. All processing runs in the backend.

Tools: **Text Replacer** (docx mail-merge), **PDF Tools** (merge/reorder/rotate pages),
**Docx to PDF** (LibreOffice conversion), **Bulk Find & Replace** (plain-text replace across
many docx files), **Docx Cleaner** (strip properties/comments/tracked changes), **PDF Compress**
(recompress content and images), **PDF Stamp** (watermark/page numbers), **Image to PDF**
(combine images into one PDF).

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
  core/          config (env-driven), errors, upload safety, naming, file output, docx run-editing,
                 middleware - shared by every tool
  tools/<name>/  router.py (HTTP only) · schemas.py · service code (no HTTP)
frontend/src/
  api/           typed fetch client (ApiError, AbortSignal)
  components/    shared UI (Banner, FileDropzone/MultiFileDropzone, ToolIntro, ErrorBoundary)
  tools/<name>/  one folder per tool: container, hook (+ pure reducer where state is non-trivial),
                 step components
```

## Add a tool

1. Backend: `backend/app/tools/<name>/` with a `router.py`; register it in `backend/app/main.py`.
2. Frontend: `frontend/src/tools/<name>/`; add an entry to `frontend/src/tools.ts`.

## Configuration (backend)

Env vars prefixed `SHORUI_` or a `backend/.env`: `MAX_UPLOAD_MB` (20), `MAX_UNCOMPRESSED_MB` (100),
`MAX_ROWS` (1000), `MAX_COLUMNS`, `MAX_CELL_CHARS`, `MAX_FILES` (20), `MAX_PDF_PAGES` (1000),
`SOFFICE_PATH` (auto-detected if unset), `CONVERSION_TIMEOUT_SECONDS` (60),
`MAX_STAMP_TEXT_CHARS` (200), `MAX_IMAGE_MB` (15), `CORS_ORIGINS` (JSON list), `LOG_LEVEL`.

Docx to PDF needs [LibreOffice](https://www.libreoffice.org/) installed on the machine running
the backend; every other tool only needs the pinned Python packages (`pypdf`, `Pillow`, ...), no
external program.

## Text Replacer

Upload a `.docx` with `{{variable}}` placeholders. Enter rows by hand or import CSV/XLSX
(header row = variable names, matched case-insensitively). One document per row; a zip
when more than one. Output name: `<value of chosen key>_<template name>.docx`.
Placeholders in body, tables, text boxes, headers and footers are replaced, including ones Word
split across runs. Missing values become empty; newlines in values become line breaks.
The UI offers a downloadable sample template and matching CSV (`backend/app/tools/text_replacer/samples/`,
regenerate with `backend/scripts/build_sample_template.py`).

## PDF Tools

Upload one or more PDFs; every page of every file is listed in one ordered table. Reorder,
rotate (90° steps) or drop individual pages, then generate a single merged PDF. No splitting
or page-thumbnail preview. Sample PDFs to try it with:
`backend/app/tools/pdf_tools/samples/`, regenerate with `backend/scripts/build_pdf_samples.py`.

## Docx to PDF

Upload a `.docx`, get back a `.pdf` rendered by headless LibreOffice - the same layout Word
would print, as a file nobody can accidentally edit. Sample document:
`backend/app/tools/docx_to_pdf/samples/`, regenerate with
`backend/scripts/build_docx_to_pdf_sample.py`.

## Bulk Find & Replace

Upload one or more `.docx` files and a list of plain-text find/replace pairs (not `{{variable}}`
syntax - it matches text exactly as it already appears, across runs Word may have split it over).
One file in returns a `.docx`; several return a zip. Sample letters:
`backend/app/tools/bulk_replace/samples/`, regenerate with
`backend/scripts/build_bulk_replace_samples.py`.

## Docx Cleaner

Strip a `.docx`'s document properties (author, etc.), reviewer comments and/or tracked changes
(insertions kept as plain text, deletions dropped) before sharing it - pick any combination of the
three. Sample document (has all three): `backend/app/tools/docx_cleaner/samples/`, regenerate with
`backend/scripts/build_docx_cleaner_sample.py`.

## PDF Compress

Recompresses a PDF's page content and re-encodes its embedded images at a chosen JPEG quality
(10-95). Works best on image-heavy PDFs; a mostly-text PDF has little left to shrink. Sample
image-heavy PDF: `backend/app/tools/pdf_compress/samples/`, regenerate with
`backend/scripts/build_pdf_compress_sample.py`.

## PDF Stamp

Adds a diagonal watermark (e.g. "DRAFT") and/or "Page N of M" numbers to every page of a PDF.

## Image to PDF

Combines one or more images (JPG, PNG, WebP, BMP, GIF, TIFF) into a single PDF, one image per
page, in upload order. Sample photos: `backend/app/tools/image_to_pdf/samples/`, regenerate with
`backend/scripts/build_image_to_pdf_samples.py`.
