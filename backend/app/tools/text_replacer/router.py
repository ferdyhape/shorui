import logging
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES
from app.core.output import content_disposition, stream_and_close
from app.core.uploads import ensure_zip_safe, read_upload, require_extension
from app.tools.text_replacer import docx_service
from app.tools.text_replacer.schemas import ExtractResponse, ParseTableResponse, parse_rows
from app.tools.text_replacer.table_import import parse_table

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/text-replacer", tags=["text-replacer"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]

SAMPLES_DIR = Path(__file__).parent / "samples"
SampleName = Literal["template.docx", "data.csv"]  # closed set: no path traversal possible
_SAMPLES: dict[str, tuple[str, str]] = {
    "template.docx": (docx_service.DOCX_MIME, "sample-template.docx"),
    "data.csv": ("text/csv", "sample-data.csv"),
}


async def _read_office_upload(
    file: UploadFile, settings: Settings, *extensions: str
) -> tuple[str, bytes]:
    name = require_extension(file, *extensions)
    data = await read_upload(file, settings)
    ensure_zip_safe(data, settings)
    return name, data


@router.post("/extract", summary="List {{variables}} found in a .docx")
async def extract(file: Annotated[UploadFile, File()], settings: SettingsDep) -> ExtractResponse:
    name, data = await _read_office_upload(file, settings, ".docx")
    variables = await run_in_threadpool(docx_service.extract_variables, data)
    return ExtractResponse(filename=name, variables=variables)


@router.post("/parse-table", summary="Read rows from a CSV or XLSX file")
async def parse_table_upload(
    file: Annotated[UploadFile, File()], settings: SettingsDep
) -> ParseTableResponse:
    name = require_extension(file, ".csv", ".txt", ".xlsx", ".xlsm")
    data = await read_upload(file, settings)
    if name.lower().endswith((".xlsx", ".xlsm")):
        ensure_zip_safe(data, settings)
    columns, rows = await run_in_threadpool(parse_table, name, data, settings)
    return ParseTableResponse(columns=columns, rows=rows)


@router.post(
    "/generate",
    summary="Render one document per row (a .docx for one row, otherwise a .zip)",
    response_class=StreamingResponse,
    responses={200: {"content": {docx_service.DOCX_MIME: {}, docx_service.ZIP_MIME: {}}}},
)
async def generate(
    file: Annotated[UploadFile, File()],
    rows: Annotated[str, Form(description="JSON array of {variable: value} objects")],
    settings: SettingsDep,
    filename_key: Annotated[str | None, Form()] = None,
) -> StreamingResponse:
    parsed_rows = parse_rows(rows, settings)
    name, data = await _read_office_upload(file, settings, ".docx")
    result = await run_in_threadpool(
        docx_service.generate, name, data, parsed_rows, filename_key or None
    )
    logger.info("generated %d document(s), template=%d bytes", len(parsed_rows), len(data))
    return StreamingResponse(
        stream_and_close(result.content),
        media_type=result.media_type,
        headers={**content_disposition(result.filename), "Content-Length": str(result.size)},
    )


@router.get(
    "/samples/{name}",
    summary="Download the sample template or matching sample data",
    response_class=FileResponse,
)
def download_sample(name: SampleName) -> FileResponse:
    media_type, filename = _SAMPLES[name]
    return FileResponse(SAMPLES_DIR / name, media_type=media_type, filename=filename)
