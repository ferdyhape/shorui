"""Shrink a PDF's size: recompress its content streams and re-encode its embedded images."""

import logging
from dataclasses import dataclass
from io import BytesIO

from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError

from app.core.errors import InvalidFileError
from app.core.naming import safe_name
from app.core.output import PDF_MIME, GeneratedFile, single_file

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CompressResult:
    file: GeneratedFile
    original_size: int
    compressed_size: int


def _load(data: bytes) -> PdfReader:
    try:
        return PdfReader(BytesIO(data))
    except (PdfReadError, ValueError) as exc:
        raise InvalidFileError("File is not a valid PDF") from exc


def compress(data: bytes, output_name: str, quality: int) -> CompressResult:
    """`quality` (1-95) is the JPEG quality used to re-encode embedded images."""
    reader = _load(data)
    writer = PdfWriter()
    writer.append(reader)

    for page in writer.pages:
        page.compress_content_streams()
        for image in page.images:
            pil_image = image.image
            if pil_image is None:
                continue
            try:
                image.replace(pil_image, quality=quality)
            except Exception:
                # A single unusual image (e.g. an unsupported colour space) must not fail the
                # whole file; it is simply left at its original encoding.
                logger.warning("could not recompress one embedded image, leaving it as-is")

    out = BytesIO()
    writer.write(out)
    compressed = out.getvalue()

    name = safe_name(output_name) or "compressed"
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return CompressResult(
        file=single_file(name, PDF_MIME, compressed),
        original_size=len(data),
        compressed_size=len(compressed),
    )
