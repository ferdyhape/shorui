import logging
import re
import tempfile
from io import BytesIO
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES
from app.core.naming import safe_name
from app.core.output import DOCX_MIME, PDF_MIME, content_disposition, stream_and_close
from app.core.uploads import ensure_zip_safe, read_upload, require_extension
from app.tools.docx_to_pdf.converter import convert_to_pdf

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/docx-to-pdf", tags=["docx-to-pdf"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]
SAMPLE_PATH = Path(__file__).parent / "samples" / "sample.docx"


def _convert(data: bytes, settings: Settings) -> bytes:
    with tempfile.TemporaryDirectory(prefix="shorui-docx2pdf-") as tmp:
        return convert_to_pdf(data, settings, Path(tmp))


@router.post(
    "/convert",
    summary="Convert a .docx to .pdf using LibreOffice",
    response_class=StreamingResponse,
    responses={200: {"content": {PDF_MIME: {}}}},
)
async def convert(file: Annotated[UploadFile, File()], settings: SettingsDep) -> StreamingResponse:
    name = require_extension(file, ".docx")
    data = await read_upload(file, settings)
    ensure_zip_safe(data, settings)
    pdf_bytes = await run_in_threadpool(_convert, data, settings)
    out_name = (safe_name(re.sub(r"\.docx$", "", name, flags=re.IGNORECASE)) or "document") + ".pdf"
    logger.info("converted docx to pdf: %d bytes -> %d bytes", len(data), len(pdf_bytes))
    return StreamingResponse(
        stream_and_close(BytesIO(pdf_bytes)),
        media_type=PDF_MIME,
        headers={**content_disposition(out_name), "Content-Length": str(len(pdf_bytes))},
    )


@router.get(
    "/samples/sample.docx",
    summary="Download a sample .docx for trying the tool out",
    response_class=FileResponse,
)
def download_sample() -> FileResponse:
    return FileResponse(SAMPLE_PATH, media_type=DOCX_MIME, filename="sample.docx")
