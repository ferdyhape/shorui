import logging
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, StreamingResponse

from app.core.config import Settings, get_settings
from app.core.errors import ERROR_RESPONSES, InvalidFileError
from app.core.output import PDF_MIME, content_disposition, stream_and_close
from app.core.uploads import read_uploads
from app.tools.pdf_tools import pdf_service
from app.tools.pdf_tools.schemas import FileInfo, InspectResponse, parse_plan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pdf-tools", tags=["pdf-tools"], responses=ERROR_RESPONSES)

SettingsDep = Annotated[Settings, Depends(get_settings)]

SAMPLES_DIR = Path(__file__).parent / "samples"
SampleName = Literal["sample-a.pdf", "sample-b.pdf"]  # closed set: no path traversal possible


def _counted(uploads: list[tuple[str, bytes]], settings: Settings) -> list[int]:
    counts = [pdf_service.page_count(data) for _, data in uploads]
    for (name, _), count in zip(uploads, counts, strict=True):
        if count > settings.max_pdf_pages:
            raise InvalidFileError(f"{name} has too many pages (max {settings.max_pdf_pages})")
    return counts


@router.post("/inspect", summary="Read the page count of each uploaded PDF")
async def inspect(
    files: Annotated[list[UploadFile], File()], settings: SettingsDep
) -> InspectResponse:
    uploads = await read_uploads(files, settings, ".pdf")
    counts = await run_in_threadpool(_counted, uploads, settings)
    return InspectResponse(
        files=[
            FileInfo(filename=name, page_count=n)
            for (name, _), n in zip(uploads, counts, strict=True)
        ]
    )


@router.post(
    "/process",
    summary="Assemble one PDF from the given pages (merge, reorder, rotate or drop pages)",
    response_class=StreamingResponse,
    responses={200: {"content": {PDF_MIME: {}}}},
)
async def process(
    files: Annotated[list[UploadFile], File()],
    plan: Annotated[str, Form(description="JSON array of {file_index, page_index, rotate}")],
    settings: SettingsDep,
    output_name: Annotated[str, Form()] = "merged.pdf",
) -> StreamingResponse:
    uploads = await read_uploads(files, settings, ".pdf")
    await run_in_threadpool(_counted, uploads, settings)  # reject oversized files up front
    ops = parse_plan(plan, len(uploads), settings)
    sources = [data for _, data in uploads]
    result = await run_in_threadpool(pdf_service.build, sources, ops, output_name)
    logger.info("built PDF: %d source file(s), %d page(s)", len(sources), len(ops))
    return StreamingResponse(
        stream_and_close(result.content),
        media_type=result.media_type,
        headers={**content_disposition(result.filename), "Content-Length": str(result.size)},
    )


@router.get(
    "/samples/{name}",
    summary="Download a sample PDF for trying the tool out",
    response_class=FileResponse,
)
def download_sample(name: SampleName) -> FileResponse:
    return FileResponse(SAMPLES_DIR / name, media_type=PDF_MIME, filename=name)
