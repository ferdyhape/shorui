import logging
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES
from app.core.output import content_disposition, stream_and_close
from app.core.uploads import ensure_zip_safe, read_uploads
from app.tools.bulk_replace import docx_service
from app.tools.bulk_replace.schemas import parse_pairs

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bulk-replace", tags=["bulk-replace"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]

SAMPLES_DIR = Path(__file__).parent / "samples"
SampleName = Literal["letter-budi.docx", "letter-sari.docx"]  # closed set: no path traversal


@router.post(
    "/process",
    summary="Apply the same find/replace pairs to one or more .docx files",
    response_class=StreamingResponse,
    responses={200: {"content": {docx_service.DOCX_MIME: {}, docx_service.ZIP_MIME: {}}}},
)
async def process(
    files: Annotated[list[UploadFile], File()],
    pairs: Annotated[str, Form(description="JSON array of [find, replace] tuples")],
    settings: SettingsDep,
) -> StreamingResponse:
    uploads = await read_uploads(files, settings, ".docx")
    for _, data in uploads:
        ensure_zip_safe(data, settings)
    parsed_pairs = parse_pairs(pairs, settings)
    result = await run_in_threadpool(docx_service.process, uploads, parsed_pairs)
    logger.info("bulk-replaced %d pair(s) across %d file(s)", len(parsed_pairs), len(uploads))
    return StreamingResponse(
        stream_and_close(result.content),
        media_type=result.media_type,
        headers={**content_disposition(result.filename), "Content-Length": str(result.size)},
    )


@router.get(
    "/samples/{name}",
    summary="Download a sample .docx for trying the tool out",
    response_class=FileResponse,
)
def download_sample(name: SampleName) -> FileResponse:
    return FileResponse(SAMPLES_DIR / name, media_type=docx_service.DOCX_MIME, filename=name)
