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
from app.tools.docx_cleaner import docx_service
from app.tools.docx_cleaner.schemas import parse_options

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/docx-cleaner", tags=["docx-cleaner"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]

SAMPLES_DIR = Path(__file__).parent / "samples"
SampleName = Literal["sample.docx"]  # closed set: no path traversal possible


@router.post(
    "/clean",
    summary="Strip metadata, comments and/or tracked changes from a .docx",
    response_class=StreamingResponse,
    responses={200: {"content": {docx_service.DOCX_MIME: {}}}},
)
async def clean(
    file: Annotated[UploadFile, File()],
    settings: SettingsDep,
    strip_properties: Annotated[bool, Form()] = True,
    strip_comments: Annotated[bool, Form()] = True,
    accept_revisions: Annotated[bool, Form()] = True,
) -> StreamingResponse:
    options = parse_options(strip_properties, strip_comments, accept_revisions)
    name = require_extension(file, ".docx")
    data = await read_upload(file, settings)
    ensure_zip_safe(data, settings)
    result = await run_in_threadpool(docx_service.process, name, data, options)
    logger.info(
        "cleaned docx: properties=%s comments=%s revisions=%s",
        options.strip_properties,
        options.strip_comments,
        options.accept_revisions,
    )
    return StreamingResponse(
        stream_and_close(result.content),
        media_type=result.media_type,
        headers={**content_disposition(result.filename), "Content-Length": str(result.size)},
    )


@router.get(
    "/samples/{name}",
    summary="Download a sample .docx (properties, comments and tracked changes) to try the tool",
    response_class=FileResponse,
)
def download_sample(name: SampleName) -> FileResponse:
    return FileResponse(SAMPLES_DIR / name, media_type=docx_service.DOCX_MIME, filename=name)
