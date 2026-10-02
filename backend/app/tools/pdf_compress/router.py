import logging
import re
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES
from app.core.naming import safe_name
from app.core.output import PDF_MIME, content_disposition, stream_and_close
from app.core.uploads import read_upload, require_extension
from app.tools.pdf_compress import pdf_service
from app.tools.pdf_compress.schemas import parse_quality

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pdf-compress", tags=["pdf-compress"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]

SAMPLES_DIR = Path(__file__).parent / "samples"
SampleName = Literal["sample-photo.pdf"]  # closed set: no path traversal possible


@router.post(
    "/compress",
    summary="Recompress a PDF's content streams and embedded images",
    response_class=StreamingResponse,
    responses={200: {"content": {PDF_MIME: {}}}},
)
async def compress(
    file: Annotated[UploadFile, File()],
    settings: SettingsDep,
    quality: Annotated[int, Form()] = 50,
) -> StreamingResponse:
    quality = parse_quality(quality)
    name = require_extension(file, ".pdf")
    data = await read_upload(file, settings)
    stem = safe_name(re.sub(r"\.pdf$", "", name, flags=re.IGNORECASE)) or "document"
    result = await run_in_threadpool(pdf_service.compress, data, f"{stem}-compressed.pdf", quality)
    logger.info(
        "compressed pdf: %d bytes -> %d bytes (quality=%d)",
        result.original_size,
        result.compressed_size,
        quality,
    )
    return StreamingResponse(
        stream_and_close(result.file.content),
        media_type=result.file.media_type,
        headers={
            **content_disposition(result.file.filename),
            "Content-Length": str(result.file.size),
            "X-Original-Size": str(result.original_size),
            "X-Compressed-Size": str(result.compressed_size),
        },
    )


@router.get(
    "/samples/{name}",
    summary="Download a sample image-heavy PDF to try the tool out",
    response_class=FileResponse,
)
def download_sample(name: SampleName) -> FileResponse:
    return FileResponse(SAMPLES_DIR / name, media_type=PDF_MIME, filename=name)
