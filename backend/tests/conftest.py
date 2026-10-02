import io
from collections.abc import Iterator

import pytest
from docx import Document
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import app

API = "/api/v1/text-replacer"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        max_upload_mb=1, max_uncompressed_mb=5, max_rows=5, max_files=3, max_pdf_pages=10
    )


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    app.dependency_overrides[get_settings] = lambda: settings
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def template() -> bytes:
    doc = Document()
    p = doc.add_paragraph("Dear ")  # placeholder split over three runs
    p.add_run("{{na").bold = True
    p.add_run("me}}")
    p.add_run(", welcome to {{ company }}.")
    table = doc.add_table(rows=1, cols=1)
    table.cell(0, 0).text = "Code: {{code}} / {{name}}"
    doc.sections[0].header.paragraphs[0].text = "Header {{company}}"
    out = io.BytesIO()
    doc.save(out)
    return out.getvalue()


def all_text(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    parts = [p.text for p in doc.paragraphs]
    parts += [c.text for t in doc.tables for r in t.rows for c in r.cells]
    parts += [p.text for p in doc.sections[0].header.paragraphs]
    return "\n".join(parts)
