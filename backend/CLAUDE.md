# Backend (FastAPI)

Python 3.11+, FastAPI, pydantic v2 / pydantic-settings, python-docx, openpyxl, pypdf, Pillow. See
[../CLAUDE.md](../CLAUDE.md) for commands, cross-cutting rules and the shared `core/` modules
(`naming`, `output`, `docx_runs`, `uploads`, `pdf_text`, `pdf_images`) every tool here is built on.

## Layering (keep it)

```
router.py    HTTP only: parse/validate request, call service, shape response. No business logic.
schemas.py   pydantic models + request-field validators (e.g. parse_rows).
service      pure Python: no FastAPI imports, raises ShoruiError subclasses.
core/        config, errors, uploads, middleware - shared by all tools.
```

- Services raise `ShoruiError` subclasses (`InvalidFileError`, `InvalidTableError`,
  `InvalidRowsError`, `PayloadTooLargeError`). One handler in `core/errors.py` maps them to
  `{"detail","code"}` with the right status. Add a new subclass rather than raising `HTTPException`.
- Endpoints are `async def` only to `await file.read(...)`. CPU-bound work (docx parse/render,
  xlsx parse) goes through `run_in_threadpool`; never block the event loop.
- Settings come from `Depends(get_settings)` so tests can override them. Do not read `os.environ`
  or import the settings singleton inside services; pass values in.

## Upload safety (every upload path)

1. `require_extension` -> 2. `read_upload` (bounded read, 413 over limit) -> 3. `ensure_zip_safe`
   for docx/xlsx (entry count + total uncompressed size, blocks zip bombs) -> 4. parse in a threadpool.
   Large outputs (multi-row zips) are written to `SpooledTemporaryFile` and streamed with a generator
   that closes the file; do not build big responses in memory.
2. Several files in one request (pdf-tools, bulk-replace): `files: list[UploadFile] = File(...)`,
   then `read_uploads(files, settings, *extensions)` - validates count (`max_files`) and size of
   each. PDFs have no zip-bomb step (not zip containers); guard total page count instead (see
   `pdf_tools.router._counted`).

## Conventions

- Type everything; `mypy --strict` must pass (`ignore_missing_imports` is on; python-docx internals are `Any`).
- `ruff` rules: E,F,I,B,UP,S,C4,SIM,RUF, line length 100. `S101` (assert) allowed in tests only.
- Logging: `logging.getLogger(__name__)`, counts and sizes only, never content or file names.
- New endpoints: add `summary`, response model, and error `responses` (router already inherits
  `ERROR_RESPONSES`). Version stays `/api/v1` unless a breaking change requires `/api/v2`.
- Filenames returned to clients go through `Content-Disposition: attachment; filename*=UTF-8''<quoted>`.
  Path parameters that select server files must be a closed `Literal` (see `SampleName`).

## Tests

- `tests/conftest.py`: `settings` (tiny limits: 1 MB upload, 5 MB uncompressed, 5 rows), `client`
  (overrides `get_settings`), `template` (docx with split-run placeholder, table, header), `all_text()`.
- Cover: happy path, each validation error with its `code`, limits (413, zip bomb, row count),
  and any bug fixed (add a regression test first).
- `test_samples.py` guards the downloadable samples; regenerate them when the template changes.

## docx_runs internals (read before editing - shared by text_replacer and bulk_replace)

Lives in `core/docx_runs.py`, not in either tool's own module - see "Shared core modules" in
[../CLAUDE.md](../CLAUDE.md).

- `paragraphs()` walks `w:p` in the body plus each distinct header/footer part; `text_nodes()`
  returns only `w:t` owned by that paragraph (text boxes hold nested paragraphs).
- `replace_matches()` takes pre-computed matches over the joined text, applies them in reverse
  order using original offsets/lengths, and only rewrites nodes whose text changed. `render_all()`
  is the convenience wrapper most tools call: `pattern.finditer(joined_text)` + a `value_for(match)`
  callback.
- `write_text()` sets `xml:space="preserve"` and expands `\n` into `<w:br/>` + new `<w:t>` siblings.
- `roots()` is also exposed for tools that edit structure rather than paragraph text - docx_cleaner
  walks it directly (snapshot the elements first, then remove/unwrap) rather than matching text.
- `core/output.single_file()`/`zip_files()` return a `GeneratedFile` (name, media type, file object,
  size); the router streams and closes it via `core/output.stream_and_close()`.
- `table_import.parse_table`: csv (delimiter sniffed, utf-8-sig then cp1252) and xlsx (first sheet,
  closes the read-only workbook), stops early past `max_rows`, dedupes/blank-skips headers, formats
  dates and integer floats as clean text.

## Config (env `SHORUI_*` or `backend/.env`)

`MAX_UPLOAD_MB=20`, `MAX_UNCOMPRESSED_MB=100`, `MAX_ZIP_ENTRIES=2000`, `MAX_ROWS=1000`,
`MAX_COLUMNS=200`, `MAX_CELL_CHARS=10000`, `MAX_FILES=20` (per request, multi-file tools),
`MAX_PDF_PAGES=1000` (total, pdf-tools), `SOFFICE_PATH` (None = auto-detect),
`CONVERSION_TIMEOUT_SECONDS=60`, `MAX_STAMP_TEXT_CHARS=200` (pdf-stamp), `MAX_IMAGE_MB=15`
(per image, image-to-pdf), `CORS_ORIGINS` (JSON list), `LOG_LEVEL=INFO`.
