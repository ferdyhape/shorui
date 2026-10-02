import io

import pytest
from pypdf import PdfReader, PdfWriter

from app.core.config import Settings
from app.core.errors import InvalidFileError, InvalidRowsError
from app.tools.pdf_stamp import pdf_service
from app.tools.pdf_stamp.schemas import parse_options

API = "/api/v1/pdf-stamp"


def blank_pdf(pages: int = 2, width: int = 300, height: int = 200) -> bytes:
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=width, height=height)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def test_stamp_adds_page_numbers_to_every_page():
    out = pdf_service.stamp(blank_pdf(3), "out", watermark_text=None, page_numbers=True)
    reader = PdfReader(io.BytesIO(out.content.read()))
    texts = [p.extract_text() for p in reader.pages]
    assert texts == ["Page 1 of 3", "Page 2 of 3", "Page 3 of 3"]


def test_stamp_adds_watermark_to_every_page():
    out = pdf_service.stamp(blank_pdf(2), "out", watermark_text="DRAFT", page_numbers=False)
    reader = PdfReader(io.BytesIO(out.content.read()))
    assert all("DRAFT" in p.extract_text() for p in reader.pages)


def test_stamp_both_at_once():
    out = pdf_service.stamp(blank_pdf(1), "out", watermark_text="DRAFT", page_numbers=True)
    text = PdfReader(io.BytesIO(out.content.read())).pages[0].extract_text()
    assert "DRAFT" in text
    assert "Page 1 of 1" in text


def test_stamp_rejects_invalid_pdf():
    with pytest.raises(InvalidFileError):
        pdf_service.stamp(b"not a pdf", "out", watermark_text="x", page_numbers=False)


def test_parse_options_requires_at_least_one():
    with pytest.raises(InvalidRowsError):
        parse_options(None, False, Settings())


def test_parse_options_rejects_overlong_text():
    settings = Settings(max_stamp_text_chars=5)
    with pytest.raises(InvalidRowsError):
        parse_options("too long text", False, settings)
    assert parse_options("fit", False, settings) == ("fit", False)


def test_api_stamp_endpoint(client):
    res = client.post(
        f"{API}/stamp",
        files={"file": ("report.pdf", blank_pdf(1))},
        data={"watermark_text": "CONFIDENTIAL", "page_numbers": "true"},
    )
    assert res.status_code == 200
    assert "report-stamped.pdf" in res.headers["content-disposition"]
    text = PdfReader(io.BytesIO(res.content)).pages[0].extract_text()
    assert "CONFIDENTIAL" in text
    assert "Page 1 of 1" in text


def test_api_rejects_no_options(client):
    res = client.post(f"{API}/stamp", files={"file": ("a.pdf", blank_pdf(1))})
    assert (res.status_code, res.json()["code"]) == (400, "invalid_rows")


def test_api_rejects_non_pdf(client):
    res = client.post(
        f"{API}/stamp", files={"file": ("a.txt", b"hi")}, data={"page_numbers": "true"}
    )
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")
