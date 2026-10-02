"""Combine one or more images into a single PDF, one image per page."""

from io import BytesIO

from pypdf import PdfWriter

from app.core.errors import InvalidFileError
from app.core.naming import safe_name
from app.core.output import PDF_MIME, GeneratedFile, single_file
from app.core.pdf_images import add_image_page


def build(images: list[bytes], output_name: str) -> GeneratedFile:
    if not images:
        raise InvalidFileError("Add at least one image")
    writer = PdfWriter()
    for data in images:
        add_image_page(writer, data)

    out = BytesIO()
    writer.write(out)
    content = out.getvalue()

    name = safe_name(output_name) or "images"
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return single_file(name, PDF_MIME, content)
