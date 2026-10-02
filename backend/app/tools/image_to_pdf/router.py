import logging
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES, PayloadTooLargeError
from app.core.output import PDF_MIME, content_disposition, stream_and_close
from app.core.uploads import read_uploads
from app.tools.image_to_pdf import image_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/image-to-pdf", tags=["image-to-pdf"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]
_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tiff")

SAMPLES_DIR = Path(__file__).parent / "samples"
SampleName = Literal["sample-1.jpg", "sample-2.jpg"]  # closed set: no path traversal possible


@router.post(
    "/build",
    summary="Combine one or more images into a single PDF, one image per page",
    response_class=StreamingResponse,
    responses={200: {"content": {PDF_MIME: {}}}},
)
async def build(
    files: Annotated[list[UploadFile], File()],
    settings: SettingsDep,
    output_name: Annotated[str, Form()] = "images.pdf",
) -> StreamingResponse:
    uploads = await read_uploads(files, settings, *_EXTENSIONS)
    max_image_bytes = settings.max_image_mb * 1024 * 1024
    for name, data in uploads:
        if len(data) > max_image_bytes:
            raise PayloadTooLargeError(f"{name} exceeds {settings.max_image_mb} MB")
    images = [data for _, data in uploads]
    result = await run_in_threadpool(image_service.build, images, output_name)
    logger.info("built pdf from %d image(s)", len(images))
    return StreamingResponse(
        stream_and_close(result.content),
        media_type=result.media_type,
        headers={**content_disposition(result.filename), "Content-Length": str(result.size)},
    )


@router.get(
    "/samples/{name}",
    summary="Download a sample image to try the tool out",
    response_class=FileResponse,
)
def download_sample(name: SampleName) -> FileResponse:
    return FileResponse(SAMPLES_DIR / name, media_type="image/jpeg", filename=name)
