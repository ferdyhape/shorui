from fastapi.testclient import TestClient

from app.main import create_app


def test_docx_to_pdf_is_registered_by_default():
    client = TestClient(create_app())
    # A GET on a POST-only route 404s if unregistered, 405 if registered - distinguishes the two
    # without depending on FastAPI/Starlette's internal route-table representation.
    assert client.get("/api/v1/docx-to-pdf/convert").status_code == 405


def test_docx_to_pdf_is_excluded_in_a_desktop_build(monkeypatch):
    monkeypatch.setenv("SHORUI_DESKTOP", "1")
    client = TestClient(create_app())
    assert client.get("/api/v1/docx-to-pdf/convert").status_code == 404
    # every other tool stays registered - this is an exclusion, not a stripped-down build
    assert client.get("/api/v1/pdf-tools/inspect").status_code == 405
    assert client.get("/api/v1/docx-cleaner/clean").status_code == 405
