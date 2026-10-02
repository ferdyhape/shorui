"""Stamp a watermark and/or page numbers onto every page of a PDF."""

import re
from io import BytesIO

from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError

from app.core import pdf_text
from app.core.errors import InvalidFileError
from app.core.naming import safe_name
from app.core.output import PDF_MIME, GeneratedFile, single_file


def _load(data: bytes) -> PdfReader:
    try:
        return PdfReader(BytesIO(data))
    except (PdfReadError, ValueError) as exc:
        raise InvalidFileError("File is not a valid PDF") from exc


def stamp(
    data: bytes,
    output_name: str,
    *,
    watermark_text: str | None,
    page_numbers: bool,
) -> GeneratedFile:
    reader = _load(data)
    writer = PdfWriter()
    writer.append(reader)
    total = len(writer.pages)

    # One watermark overlay, sized to the first page, reused on every page: cheap and the
    # pages in a given PDF are near-always a single uniform size.
    first = writer.pages[0] if writer.pages else None
    width = float(first.mediabox.width) if first else 612.0
    height = float(first.mediabox.height) if first else 792.0
    watermark = (
        pdf_text.build_overlay_page(width, height, watermark_text, opacity=0.2, rotate_degrees=45)
        if watermark_text
        else None
    )

    for index, page in enumerate(writer.pages, start=1):
        if watermark is not None:
            page.merge_page(watermark)
        if page_numbers:
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            footer = pdf_text.build_footer_page(page_width, page_height, f"Page {index} of {total}")
            page.merge_page(footer)

    out = BytesIO()
    writer.write(out)
    content = out.getvalue()

    stem = safe_name(re.sub(r"\.pdf$", "", output_name, flags=re.IGNORECASE)) or "stamped"
    return single_file(f"{stem}.pdf", PDF_MIME, content)
