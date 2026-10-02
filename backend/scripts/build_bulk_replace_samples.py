"""Regenerate the downloadable Bulk Find & Replace samples.

    cd backend && .venv/Scripts/python scripts/build_bulk_replace_samples.py

Two letters mentioning "Acme Corp" and "Order #1001" several times (including the header, and
one occurrence deliberately split over two runs) so trying the tool shows a real multi-file,
multi-match replace instead of a single trivial match.
"""

from pathlib import Path

from docx import Document

OUT = Path(__file__).resolve().parent.parent / "app" / "tools" / "bulk_replace" / "samples"


def build_letter(customer: str, order_no: str) -> Document:
    doc = Document()
    doc.sections[0].header.paragraphs[0].text = "Acme Corp - Customer Service"

    doc.add_paragraph(f"Dear {customer},")
    doc.add_paragraph()
    body = doc.add_paragraph("Thank you for being an ")
    body.add_run("Ac")  # split across two runs on purpose, like Word's spellcheck does
    body.add_run("me Corp")
    body.add_run(f" customer. Your order {order_no} with Acme Corp has shipped.")
    doc.add_paragraph()
    doc.add_paragraph(f"If you have questions about order {order_no}, contact Acme Corp support.")
    doc.add_paragraph()
    doc.add_paragraph("Regards,")
    doc.add_paragraph("Acme Corp Support Team")
    return doc


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    build_letter("Budi Santoso", "Order #1001").save(OUT / "letter-budi.docx")
    build_letter("Sari Wulandari", "Order #1002").save(OUT / "letter-sari.docx")
    print(f"Wrote {OUT} (letter-budi.docx, letter-sari.docx)")


if __name__ == "__main__":
    main()
