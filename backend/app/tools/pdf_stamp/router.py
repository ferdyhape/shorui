import logging
import re
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES
from app.core.naming import safe_name
from app.core.output import PDF_MIME, content_disposition, stream_and_close
from app.core.uploads import read_upload, require_extension
from app.tools.pdf_stamp import pdf_service
from app.tools.pdf_stamp.schemas import parse_options

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pdf-stamp", tags=["pdf-stamp"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.post(
    "/stamp",
    summary="Add a watermark and/or page numbers to every page of a PDF",
    response_class=StreamingResponse,
    responses={200: {"content": {PDF_MIME: {}}}},
)
async def stamp(
    file: Annotated[UploadFile, File()],
    settings: SettingsDep,
    watermark_text: Annotated[str | None, Form()] = None,
    page_numbers: Annotated[bool, Form()] = False,
) -> StreamingResponse:
    text, numbers = parse_options(watermark_text, page_numbers, settings)
    name = require_extension(file, ".pdf")
    data = await read_upload(file, settings)
    stem = safe_name(re.sub(r"\.pdf$", "", name, flags=re.IGNORECASE)) or "document"
    result = await run_in_threadpool(
        pdf_service.stamp, data, f"{stem}-stamped", watermark_text=text, page_numbers=numbers
    )
    logger.info("stamped pdf: watermark=%s page_numbers=%s", bool(text), numbers)
    return StreamingResponse(
        stream_and_close(result.content),
        media_type=result.media_type,
        headers={**content_disposition(result.filename), "Content-Length": str(result.size)},
    )
