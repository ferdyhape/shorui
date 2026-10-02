"""Merge, reorder, rotate and drop pages across one or more PDFs into one output PDF."""

from dataclasses import dataclass
from io import BytesIO

from pypdf import PdfReader, PdfWriter
from pypdf.errors import DependencyError, PdfReadError

from app.core.errors import InvalidFileError
from app.core.naming import safe_name
from app.core.output import PDF_MIME, GeneratedFile, single_file

ROTATIONS = (0, 90, 180, 270)


def _load(data: bytes) -> PdfReader:
    try:
        reader = PdfReader(BytesIO(data))
    except (PdfReadError, ValueError) as exc:
        raise InvalidFileError("File is not a valid PDF") from exc
    if reader.is_encrypted:
        # pypdf can open some encrypted PDFs with an empty owner password; try that,
        # otherwise we have no password to offer and must refuse.
        try:
            if reader.decrypt("") == 0:
                raise InvalidFileError("PDF is password-protected; remove the password first")
        except DependencyError as exc:
            raise InvalidFileError("PDF is password-protected; remove the password first") from exc
    return reader


def page_count(data: bytes) -> int:
    return len(_load(data).pages)


@dataclass(frozen=True)
class PageOp:
    file_index: int  # index into the `sources` list passed to build()
    page_index: int  # 0-based page number within that file
    rotate: int = 0  # degrees clockwise, added to the page's existing rotation


def build(sources: list[bytes], ops: list[PageOp], output_name: str) -> GeneratedFile:
    """Assemble one output PDF from `ops`, in the order given."""
    readers = [_load(data) for data in sources]
    writer = PdfWriter()
    for op in ops:
        if op.file_index < 0 or op.file_index >= len(readers):
            raise InvalidFileError(f"Page references an unknown file (index {op.file_index})")
        pages = readers[op.file_index].pages
        if op.page_index < 0 or op.page_index >= len(pages):
            raise InvalidFileError(
                f"File {op.file_index} has no page {op.page_index + 1} (it has {len(pages)})"
            )
        added = writer.add_page(pages[op.page_index])
        if op.rotate:
            added.rotate(op.rotate)
    if len(writer.pages) == 0:
        raise InvalidFileError("Output has no pages")

    out = BytesIO()
    writer.write(out)
    name = safe_name(output_name) or "merged"
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return single_file(name, PDF_MIME, out.getvalue())
