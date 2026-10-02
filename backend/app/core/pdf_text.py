"""Draw plain text onto a PDF page without any extra dependency.

A readable PDF page only needs a standard Type1 font (Helvetica, no embedding) and a short
content stream - both built directly with pypdf's low-level generic objects. Used by every
sample-PDF builder script and by pdf_stamp (watermark / page numbers).
"""

from pypdf import PdfWriter
from pypdf._page import PageObject
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject, NumberObject

_FONT_RESOURCE = "/F1"


def _font_resources(writer: PdfWriter) -> DictionaryObject:
    font = DictionaryObject()
    font[NameObject("/Type")] = NameObject("/Font")
    font[NameObject("/Subtype")] = NameObject("/Type1")
    font[NameObject("/BaseFont")] = NameObject("/Helvetica")
    fonts = DictionaryObject()
    fonts[NameObject(_FONT_RESOURCE)] = writer._add_object(font)
    resources = DictionaryObject()
    resources[NameObject("/Font")] = fonts
    return resources


def _escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def add_centered_lines_page(
    writer: PdfWriter, width: float, height: float, lines: list[str], font_size: int = 14
) -> PageObject:
    """A new page of the given size with `lines` stacked, starting near the top."""
    page = writer.add_blank_page(width=width, height=height)
    page[NameObject("/Resources")] = _font_resources(writer)

    leading = round(font_size * 1.3)
    ops = [
        b"BT",
        f"/F1 {font_size} Tf".encode(),
        f"20 {height - 40} Td".encode(),
        f"{leading} TL".encode(),
    ]
    for i, line in enumerate(lines):
        if i:
            ops.append(b"T*")  # moves down by TL and resets x - keeps lines aligned
        ops.append(f"({_escape(line)}) Tj".encode())
    ops.append(b"ET")

    stream = DecodedStreamObject()
    stream.set_data(b"\n".join(ops))
    page[NameObject("/Contents")] = writer._add_object(stream)
    return page


def make_text_document(
    width: float, height: float, *pages: list[str], font_size: int = 14
) -> PdfWriter:
    """One PdfWriter with one page per `pages` entry, each a list of stacked lines."""
    writer = PdfWriter()
    for lines in pages:
        add_centered_lines_page(writer, width, height, lines, font_size)
    return writer


def build_overlay_page(
    width: float,
    height: float,
    text: str,
    *,
    font_size: int = 48,
    opacity: float = 0.25,
    rotate_degrees: float = 45,
    position: tuple[float, float] | None = None,
) -> PageObject:
    """A page with only `text`, centered, rotated and translucent - merged onto a real page
    with `page.merge_page()` to stamp a diagonal watermark without touching page content."""
    writer = PdfWriter()
    page = writer.add_blank_page(width=width, height=height)

    gs = DictionaryObject()
    gs[NameObject("/Type")] = NameObject("/ExtGState")
    gs[NameObject("/ca")] = NumberObject(opacity)
    ext_g_states = DictionaryObject()
    ext_g_states[NameObject("/GS1")] = writer._add_object(gs)

    resources = _font_resources(writer)
    resources[NameObject("/ExtGState")] = ext_g_states
    page[NameObject("/Resources")] = resources

    x, y = position or (width / 2, height / 2)
    ops = (
        f"q\n/GS1 gs\n1 0 0 1 {x} {y} cm\n{rotate_degrees} rotate\n"
        f"BT\n/F1 {font_size} Tf\n0 0 Td\n({_escape(text)}) Tj\nET\nQ"
    ).encode()
    stream = DecodedStreamObject()
    stream.set_data(ops)
    page[NameObject("/Contents")] = writer._add_object(stream)
    return page


def build_footer_page(width: float, height: float, text: str, font_size: int = 10) -> PageObject:
    """A page with one line of text centered near the bottom edge (for page numbers)."""
    return build_overlay_page(
        width,
        height,
        text,
        font_size=font_size,
        opacity=1.0,
        rotate_degrees=0,
        position=(width / 2 - len(text) * font_size * 0.28, 24),
    )
