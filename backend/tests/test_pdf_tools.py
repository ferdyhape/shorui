import io

import pytest
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

from app.core.errors import InvalidFileError
from app.tools.pdf_tools import pdf_service
from app.tools.pdf_tools.pdf_service import PageOp

PDF_API = "/api/v1/pdf-tools"


def make_pdf(label: str, pages: int) -> bytes:
    """A tiny valid PDF with `pages` blank pages, each page tagged with a marker."""
    writer = PdfWriter()
    for i in range(pages):
        page = writer.add_blank_page(width=200, height=200)
        # Marker lets a test tell which source page ended up where after merging.
        page[NameObject("/Shorui")] = TextStringObject(f"{label}-{i}")
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def page_markers(data: bytes) -> list[str]:
    return [str(p.get("/Shorui")) for p in PdfReader(io.BytesIO(data)).pages]


def test_page_count():
    assert pdf_service.page_count(make_pdf("a", 3)) == 3


def test_rejects_invalid_pdf():
    with pytest.raises(InvalidFileError):
        pdf_service.page_count(b"not a pdf")


def test_build_merges_reorders_and_rotates():
    a, b = make_pdf("a", 2), make_pdf("b", 1)
    ops = [
        PageOp(file_index=1, page_index=0, rotate=90),
        PageOp(file_index=0, page_index=1, rotate=0),
        PageOp(file_index=0, page_index=0, rotate=0),
    ]
    result = pdf_service.build([a, b], ops, "out.pdf")
    data = result.content.read()
    pages = PdfReader(io.BytesIO(data)).pages
    assert [str(p.get("/Shorui")) for p in pages] == ["b-0", "a-1", "a-0"]
    assert pages[0].rotation == 90
    assert result.filename == "out.pdf"


def test_build_rejects_unknown_page():
    with pytest.raises(InvalidFileError):
        pdf_service.build([make_pdf("a", 1)], [PageOp(0, 5)], "out.pdf")


def test_build_rejects_unknown_file_index():
    with pytest.raises(InvalidFileError):
        pdf_service.build([make_pdf("a", 1)], [PageOp(3, 0)], "out.pdf")


def test_build_output_name_defaults_extension_and_sanitizes():
    result = pdf_service.build([make_pdf("a", 1)], [PageOp(0, 0)], "a/b")
    assert result.filename == "a_b.pdf"


def test_inspect_endpoint(client):
    res = client.post(
        f"{PDF_API}/inspect",
        files=[
            ("files", ("a.pdf", make_pdf("a", 2), "application/pdf")),
            ("files", ("b.pdf", make_pdf("b", 3), "application/pdf")),
        ],
    )
    assert res.status_code == 200
    assert res.json() == {
        "files": [
            {"filename": "a.pdf", "page_count": 2},
            {"filename": "b.pdf", "page_count": 3},
        ]
    }


def test_process_endpoint_merges(client):
    import json

    plan = [
        {"file_index": 0, "page_index": 1},
        {"file_index": 1, "page_index": 0, "rotate": 180},
    ]
    res = client.post(
        f"{PDF_API}/process",
        files=[
            ("files", ("a.pdf", make_pdf("a", 2), "application/pdf")),
            ("files", ("b.pdf", make_pdf("b", 1), "application/pdf")),
        ],
        data={"plan": json.dumps(plan), "output_name": "combined.pdf"},
    )
    assert res.status_code == 200
    assert "combined.pdf" in res.headers["content-disposition"]
    assert page_markers(res.content) == ["a-1", "b-0"]
    assert PdfReader(io.BytesIO(res.content)).pages[1].rotation == 180


def test_rejects_too_many_files(client):
    # settings fixture caps max_files at 3
    files = [("files", (f"{i}.pdf", make_pdf(str(i), 1), "application/pdf")) for i in range(4)]
    res = client.post(f"{PDF_API}/inspect", files=files)
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")


def test_rejects_too_many_pages_in_one_file(client):
    # settings fixture caps max_pdf_pages at 10
    res = client.post(
        f"{PDF_API}/inspect",
        files=[("files", ("a.pdf", make_pdf("a", 11), "application/pdf"))],
    )
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")


def test_rejects_plan_with_too_many_pages(client):
    import json

    # 6 pages each, under the per-file cap, but the plan below asks for 11 total
    plan = [{"file_index": 0, "page_index": i % 6} for i in range(11)]
    res = client.post(
        f"{PDF_API}/process",
        files=[("files", ("a.pdf", make_pdf("a", 6), "application/pdf"))],
        data={"plan": json.dumps(plan)},
    )
    assert (res.status_code, res.json()["code"]) == (400, "invalid_rows")


def test_sample_pdfs_are_usable(client):
    from app.tools.pdf_tools.router import SAMPLES_DIR

    a = (SAMPLES_DIR / "sample-a.pdf").read_bytes()
    b = (SAMPLES_DIR / "sample-b.pdf").read_bytes()
    assert pdf_service.page_count(a) == 2
    assert pdf_service.page_count(b) == 1


def test_download_pdf_samples(client):
    res = client.get(f"{PDF_API}/samples/sample-a.pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "sample-a.pdf" in res.headers["content-disposition"]

    res = client.get(f"{PDF_API}/samples/sample-b.pdf")
    assert res.status_code == 200


def test_download_pdf_sample_rejects_unknown_name(client):
    assert client.get(f"{PDF_API}/samples/../../etc/passwd").status_code in (404, 422)
    assert client.get(f"{PDF_API}/samples/secret.pdf").status_code == 422
