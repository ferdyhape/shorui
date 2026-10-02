# Shorui

Dashboard of document tools. React frontend + FastAPI backend. All document processing runs in the
backend; the frontend only collects input and shows results. Tools so far:

- **Text Replacer** - mail-merge for `.docx`: `{{variable}}` placeholders + rows of data, one
  output document per row.
- **PDF Tools** - merge, reorder, rotate and drop pages from one or more PDFs into one PDF.
- **Docx to PDF** - convert a `.docx` to `.pdf` via headless LibreOffice.
- **Bulk Find & Replace** - apply the same literal find/replace pairs across many `.docx` files.
- **Docx Cleaner** - strip document properties, reviewer comments and/or tracked changes.
- **PDF Compress** - recompress a PDF's content streams and embedded images.
- **PDF Stamp** - add a watermark and/or page numbers to every page of a PDF.
- **Image to PDF** - combine one or more images into a single PDF.

There are two distributions of the same app: the **web** app (`backend/` + `frontend/`, this file)
and an installable **desktop** app (`desktop/`, see [desktop/README.md](desktop/README.md)). Develop
and add tools in `backend/`/`frontend/` only, exactly as described below; `desktop/` packages
whatever is currently there on demand (`npm run sync`/`npm run build` inside `desktop/`) and is
never where source code lives. The only desktop-specific thing to know while working in
`backend/`/`frontend/`: a tool can opt out of the desktop build with `desktop: false` in
`frontend/src/tools.ts` (currently only Docx to PDF, which needs LibreOffice installed separately)

- see "Add a tool" below.

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
  core/                        config (pydantic-settings, SHORUI_* env), errors, uploads, middleware,
                                output (GeneratedFile/zip streaming), naming (safe_name/dedupe_names),
                                docx_runs (shared run-splitting engine for every .docx-editing tool),
                                pdf_text (draw text/watermarks on a PDF page, no extra dependency),
                                pdf_images (embed an image as a PDF page, via Pillow)
  tools/<name>/                one folder per tool: router.py (HTTP only), schemas.py, service code
  tools/text_replacer/samples/ downloadable sample template.docx + data.csv (generated, see below)
backend/scripts/               build_sample_template.py (regenerates the samples)
backend/tests/                 pytest; conftest.py has client/settings/template fixtures
frontend/src/
  styles/tokens.css            design tokens (mirrored from Kagami) - single source of truth
  index.css                    Tailwind v4 + fonts + base styles
  components/core|navigation/  Button, Card, Input, Select, Checkbox, Icon, Sidebar, PageHeader,
                                ThemeToggle
  components/                  Banner, FileDropzone, MultiFileDropzone, FileList, ToolIntro,
                                ErrorBoundary
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
- **Responsive:** every page works from 360px up (mobile-first, token breakpoints `sm/md/lg/xl`,
  drawer navigation below `md`, 44px touch targets). Rules and tokens: frontend/CLAUDE.md.
- **Design:** UI must match Kagami (`D:\Research\FunkyAI\kagami\web\frontend-v1`). Use tokens only;
  see frontend/CLAUDE.md.
- **Dependencies:** prefer what is already installed. Pin nothing exotic; ask before adding a heavy
  one. Pillow was added for image-to-pdf/pdf-compress (standard, not exotic); everything else reuses
  pypdf/python-docx already in use.

## Add a tool (checklist)

1. Backend: `backend/app/tools/<name>/` with `router.py` (thin), `schemas.py`, service module(s).
   Register the router in `backend/app/main.py` under the `v1` router. Raise domain errors from
   `core/errors.py`, never `HTTPException` in services. Add tests in `backend/tests/`.
2. Frontend: `frontend/src/tools/<name>/` (container, `use<Name>` hook + pure reducer, step
   components), `frontend/src/api/<name>.ts`, then add an entry (id, name, description, icon,
   category, lazy component) to `frontend/src/tools.ts`. If the icon is new, add it to
   `components/core/Icon.tsx`. Needs an external program (like LibreOffice) the desktop build can't
   bundle? Set `desktop: false` on that entry and add the matching `if os.environ.get("SHORUI_DESKTOP")`
   guard in `backend/app/main.py` around its router - see `docx_to_pdf` for the exact pattern.
3. If the tool has a downloadable sample, add its samples dir to `SAMPLE_DIRS` in
   `desktop/scripts/sync.sh` too, or that sample 500s in the desktop build (web is unaffected).
4. Update the README "Layout"/tool notes if structure changed; keep this file accurate.

## Shared core modules (use these, don't duplicate)

- `core/naming.py`: `safe_name()` (strip characters a filesystem/zip can't hold), `dedupe_names()`
  (case-insensitive `-2`, `-3` suffixes). Every tool that writes file names uses these.
- `core/output.py`: `GeneratedFile` (filename, media_type, file-like content, size),
  `single_file()`, `zip_files()` (spooled, bounded memory), `stream_and_close()`,
  `content_disposition()`. Every router streams its result this way.
- `core/docx_runs.py`: the engine behind every `.docx` text edit. `load_docx()`, `paragraphs()`
  (body + nested tables + text boxes + headers/footers), `joined_text()`, `render_all(doc, pattern,
value_for)` (matches `pattern` against each paragraph's _joined_ text - Word can split one string
  across several runs - and rewrites only the runs it spans). `text_replacer` ({{variable}} syntax)
  and `bulk_replace` (literal text) are both thin wrappers around this; a third docx-editing tool
  should be too, not a new copy of the run-walking logic.
- `core/uploads.py`: `require_extension`, `read_upload` (size-capped), `read_uploads` (multi-file:
  extension + count + size), `ensure_zip_safe` (zip-bomb guard for docx/xlsx).
- `core/pdf_text.py`: `add_centered_lines_page`/`make_text_document` (plain text pages, used by
  every sample-PDF builder script), `build_overlay_page`/`build_footer_page` (translucent/rotated
  text merged onto an existing page - pdf_stamp's watermark and page numbers). No extra dependency:
  a readable page only needs the standard Helvetica font and a short content stream.
- `core/pdf_images.py`: `add_image_page(writer, image_bytes)` - Pillow normalizes any input format
  to JPEG, pypdf embeds the JPEG bytes directly as a `/DCTDecode` XObject (no re-encoding of pixel
  data needed). Used by image_to_pdf and the pdf-compress sample builder.

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

## PDF Tools (domain facts)

- Backend: `pypdf`. `PageOp(file_index, page_index, rotate)` - `file_index` is the position of a
  file in the multipart `files` list, **not** a frontend-assigned id; the frontend's `fileId` is
  kept equal to that position (it never removes a whole file, only pages, so the two never drift).
- `rotate` is degrees clockwise, must be a multiple of 90; applied on top of the page's own rotation
  via `PageObject.rotate()`. Encrypted PDFs: pypdf tries an empty password once, else `InvalidFileError`
  (no `cryptography` package installed - this is a cheap default, not full encrypted-PDF support).
- Endpoints: `POST /inspect` (files -> page counts), `POST /process` (files + `plan` JSON array of
  `{file_index, page_index, rotate}` + `output_name` -> one PDF). No split/zip output - merge only.
- Settings: `max_files` (per request, shared with bulk-replace), `max_pdf_pages` (total pages
  across all files in one request, checked both per-file at upload and against the plan length).
- Frontend has no thumbnail rendering (no PDF-render library installed); pages are listed as
  "filename — page N" text rows, reordered/rotated/removed with buttons (no drag-and-drop).
- Samples: `sample-a.pdf` (2 pages), `sample-b.pdf` (1 page), each page just a short label drawn
  with the standard Helvetica font (no embedding, no extra dependency - see the script). Edit
  `backend/scripts/build_pdf_samples.py`, run
  `cd backend && .venv/Scripts/python scripts/build_pdf_samples.py`, commit the regenerated files.
  `GET /samples/{sample-a.pdf|sample-b.pdf}`.

## Docx to PDF (domain facts)

- Shells out to headless LibreOffice (`app/tools/docx_to_pdf/converter.py`). Each conversion gets
  its own temp profile dir (`-env:UserInstallation=...`) so concurrent requests never collide on
  LibreOffice's single-instance lock.
- `resolve_soffice()`: `SHORUI_SOFFICE_PATH` env override, else `PATH`, else a few common install
  paths (Windows default: `C:\Program Files\LibreOffice\program\soffice.exe`). Missing ->
  `ServiceUnavailableError` (503). Non-zero exit or timeout -> `ConversionError` (422).
- `tests/test_docx_to_pdf.py` has fast mocked-subprocess unit tests plus two real-LibreOffice tests
  gated on `shutil.which`/common paths, so they still pass on a machine without LibreOffice.
- Sample: `sample.docx` - plain prose with a table and bullets, deliberately not a Text Replacer
  template (no `{{placeholders}}`), to demonstrate layout conversion rather than mail-merge. Edit
  `backend/scripts/build_docx_to_pdf_sample.py`, run
  `cd backend && .venv/Scripts/python scripts/build_docx_to_pdf_sample.py`, commit the file.
  `GET /samples/sample.docx`.

## Bulk Find & Replace (domain facts)

- Literal text, not `{{variable}}` syntax: `build_pattern()` turns `[(find, replace), ...]` into one
  alternation regex with **longest term first** (so "Order Total" isn't shadowed by "Order"), then
  reuses `core.docx_runs.render_all`. Case-sensitive, exact substring match.
- Output name = original filename (sanitized, deduped), not derived from a data key. One file in
  -> a `.docx`; several -> `bulk-replace_<N>-files.zip`.
- Endpoint: `POST /process` (files + `pairs` JSON array of `[find, replace]` tuples).
- Samples: `letter-budi.docx` + `letter-sari.docx`, two short letters both mentioning "Acme Corp"
  several times, including the header and one occurrence deliberately split across two runs (so
  trying the tool exercises the same run-splitting path the tests do). Edit
  `backend/scripts/build_bulk_replace_samples.py`, run
  `cd backend && .venv/Scripts/python scripts/build_bulk_replace_samples.py`, commit both files.
  `GET /samples/{letter-budi.docx|letter-sari.docx}`.

## Docx Cleaner (domain facts)

- Three independent toggles, at least one required: strip properties (python-docx
  `core_properties`, string fields only - dates are left alone, python-docx rejects `None` for
  them), strip comments (removes `w:commentRangeStart/End`/`w:commentReference` anchors via
  `core.docx_runs.roots()`; does **not** delete the underlying `comments.xml` part - python-docx
  exposes no API for that, and an orphaned unreferenced part is harmless), accept tracked changes
  (`w:ins`/`w:moveTo` unwrapped in place keeping their text, `w:del`/`w:moveFrom` and the
  `*PrChange` metadata tags removed outright - python-docx has no API for any of this either, so
  it is raw lxml tree surgery, snapshot-then-mutate to stay safe while walking).
- Endpoint: `POST /clean` (file + three `Form` bools, default all `true`) -> one `.docx`, named
  `<stem>-cleaned.docx`.
- Sample: `sample.docx` - real properties, a real comment (python-docx 1.2+ has native
  `add_comment`), and a real tracked insertion/deletion built with raw OXML (the same technique
  `_accept_revisions` undoes). Edit `backend/scripts/build_docx_cleaner_sample.py`, regenerate,
  commit. `GET /samples/sample.docx`.

## PDF Compress (domain facts)

- `PdfWriter.append(reader)` then per page: `compress_content_streams()` + re-encode every
  embedded image via `page.images[i].replace(image, quality=N)` (quality 10-95, validated). A
  single image that fails to re-encode is logged and left at its original encoding, not fatal.
- Endpoint: `POST /compress` (file + `quality` Form, default 50) -> one PDF. Reports
  `X-Original-Size`/`X-Compressed-Size` response headers (both listed in CORS `expose_headers` in
  `main.py` - add any new custom header there too, or the browser cannot read it).
- Sample: `sample-photo.pdf` - two pages of per-pixel random colour ("noisy", like a real photo;
  a flat/text PDF would barely shrink). Edit `backend/scripts/build_pdf_compress_sample.py`.

## PDF Stamp (domain facts)

- Watermark: one overlay page (`pdf_text.build_overlay_page`, diagonal, 20% opacity) built once
  and `page.merge_page()`'d onto every page - cheap, and pages in a given PDF are near-always one
  uniform size. Page numbers: one "Page N of M" footer overlay per page (text differs per page).
  At least one of the two must be supplied.
- Endpoint: `POST /stamp` (file + `watermark_text` Form, `page_numbers` Form bool) -> one PDF,
  named `<stem>-stamped.pdf`.
- No sample of its own - the frontend links PDF Tools' `sample-a.pdf` (`api/pdfTools.ts`'s
  `sampleUrl`), a deliberate cross-tool reuse rather than generating a near-duplicate file.

## Image to PDF (domain facts)

- `core.pdf_images.add_image_page` per upload, one PDF page per image, page size = the image's
  own aspect ratio (capped at 1500pt on the long side). PNG/WebP transparency is flattened onto a
  white background before JPEG re-encoding (a PDF image here has no alpha channel).
- Endpoint: `POST /build` (files + `output_name` Form, default `images.pdf`) -> one PDF. Images
  combine in upload order; there is no reorder step (a deliberate scope cut, like PDF Tools having
  no thumbnails - note it if this needs to change later).
- Per-image size cap is `max_image_mb` (separate from the generic per-file `max_upload_mb`,
  checked in the router after `read_uploads`).
- Samples: `sample-1.jpg`/`sample-2.jpg`, small labelled JPEGs via Pillow's `ImageDraw`. Edit
  `backend/scripts/build_image_to_pdf_samples.py`.

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
  `--headless --convert-to png` to eyeball a generated docx. `docx-to-pdf` also shells out to it.
- `pypdf`'s `PdfWriter.add_page()` returns the added page - rotate that returned object, not the
  source page (rotating the source would also rotate it in any other output built from the same
  reader). No `cryptography` package is installed, so AES-encrypted PDFs can't be decrypted even
  with an empty password; this is a deliberate scope cut, not a bug.
- A multi-file `<input>` needs `userEvent.upload(input, files)` in tests; for a file type the
  `accept` attribute would filter out, pass `{ applyAccept: false }` or upload fails silently.
- A JSX expression with `{var}text{var2}` renders as several text nodes - `getByText('exact
string')` won't match it. Build the full string in one template literal before rendering it.
- A `<label>` whose JSX also renders a hint/description _inside_ it changes the accessible name to
  "label + hint" - `getByLabelText('short label')` then fails. Wire the hint as `aria-describedby`
  on the input instead (see `Checkbox.tsx`) so the name stays just the label.
- `userEvent.upload` on an input with `accept="image/*"` silently drops files whose `File` object
  has no (or a non-image) MIME type - `new File(['x'], 'a.jpg')` alone is not enough; pass
  `{ type: 'image/jpeg' }` explicitly, or the upload is filtered out with no error.
- pypdf has no "image to PDF page" API; a JPEG's own bytes are a valid `/DCTDecode` image stream
  as-is (no re-encoding of pixel data) - see `core/pdf_images.py` before reaching for a heavier
  dependency to do this.
- Desktop build (`desktop/`): Rust's GNU target on Windows needs a _full_ standalone MinGW-w64
  (`dlltool` etc.) - `rustup`'s own `rust-mingw` component alone is not enough and fails with
  `dlltool could not create import library`/`CreateProcess` errors. See `desktop/README.md`'s
  one-time setup. `PyInstaller --add-data` resolves a relative `SRC` against its own workdir, not
  the caller's cwd - always pass it an absolute Windows-style path (`pwd -W` in Git Bash, not
  `cygpath -m` on an already-relative path, which is a no-op).
