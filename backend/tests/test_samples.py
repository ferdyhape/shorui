import csv
import io
import zipfile

from app.tools.text_replacer import docx_service
from app.tools.text_replacer.router import SAMPLES_DIR
from tests.conftest import API, all_text


def sample_rows() -> tuple[list[str], list[dict[str, str]]]:
    with (SAMPLES_DIR / "data.csv").open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        return list(reader.fieldnames or []), list(reader)


def test_sample_csv_matches_template_variables():
    template = (SAMPLES_DIR / "template.docx").read_bytes()
    columns, rows = sample_rows()
    assert columns == docx_service.extract_variables(template)
    assert len(rows) >= 2


def test_sample_renders_fully_for_every_row(client):
    template = (SAMPLES_DIR / "template.docx").read_bytes()
    _, rows = sample_rows()
    for row in rows:
        assert "{{" not in all_text(docx_service.render(template, row))

    import json

    res = client.post(
        f"{API}/generate",
        files={"file": ("sample-template.docx", template)},
        data={"rows": json.dumps(rows), "filename_key": "nama"},
    )
    assert res.status_code == 200
    with zipfile.ZipFile(io.BytesIO(res.content)) as zf:
        assert len(zf.namelist()) == len(rows)
        assert "Budi Santoso_sample-template.docx" in zf.namelist()


def test_download_samples(client):
    res = client.get(f"{API}/samples/template.docx")
    assert res.status_code == 200
    assert "sample-template.docx" in res.headers["content-disposition"]
    assert res.content == (SAMPLES_DIR / "template.docx").read_bytes()

    res = client.get(f"{API}/samples/data.csv")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")


def test_download_sample_rejects_unknown_name(client):
    assert client.get(f"{API}/samples/../../etc/passwd").status_code in (404, 422)
    assert client.get(f"{API}/samples/secret.txt").status_code == 422
