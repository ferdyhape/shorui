"""Regenerate the downloadable PDF Tools samples.

    cd backend && .venv/Scripts/python scripts/build_pdf_samples.py

Writes app/tools/pdf_tools/samples/{sample-a.pdf,sample-b.pdf}. No extra dependency (reportlab
etc.) - a readable PDF only needs a standard Type1 font (Helvetica, no embedding) and a short
content stream, both built directly with pypdf's low-level generic objects.
"""

from pathlib import Path

from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

OUT = Path(__file__).resolve().parent.parent / "app" / "tools" / "pdf_tools" / "samples"
PAGE_SIZE = (300, 200)


def add_text_page(writer: PdfWriter, lines: list[str]) -> None:
    page = writer.add_blank_page(width=PAGE_SIZE[0], height=PAGE_SIZE[1])

    font = DictionaryObject()
    font[NameObject("/Type")] = NameObject("/Font")
    font[NameObject("/Subtype")] = NameObject("/Type1")
    font[NameObject("/BaseFont")] = NameObject("/Helvetica")
    resources = DictionaryObject()
    fonts = DictionaryObject()
    fonts[NameObject("/F1")] = writer._add_object(font)
    resources[NameObject("/Font")] = fonts
    page[NameObject("/Resources")] = resources

    ops = [b"BT", b"/F1 14 Tf", f"20 {PAGE_SIZE[1] - 40} Td".encode(), b"18 TL"]
    for i, line in enumerate(lines):
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        # T* moves down by the leading (TL) set above and resets x - keeps every line aligned.
        if i:
            ops.append(b"T*")
        ops.append(f"({escaped}) Tj".encode())
    ops.append(b"ET")

    stream = DecodedStreamObject()
    stream.set_data(b"\n".join(ops))
    page[NameObject("/Contents")] = writer._add_object(stream)


def build_sample_a() -> PdfWriter:
    writer = PdfWriter()
    add_text_page(writer, ["Sample PDF A", "Page 1 of 2"])
    add_text_page(writer, ["Sample PDF A", "Page 2 of 2"])
    return writer


def build_sample_b() -> PdfWriter:
    writer = PdfWriter()
    add_text_page(writer, ["Sample PDF B", "Page 1 of 1"])
    return writer


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, build in (("sample-a.pdf", build_sample_a), ("sample-b.pdf", build_sample_b)):
        with (OUT / name).open("wb") as fh:
            build().write(fh)
    print(f"Wrote {OUT} (sample-a.pdf: 2 pages, sample-b.pdf: 1 page)")


if __name__ == "__main__":
    main()
