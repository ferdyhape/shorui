import io
import zipfile

from openpyxl import Workbook

from tests.conftest import API, all_text


def post_generate(client, template, rows, key="code", name="tpl.docx"):
    return client.post(
        f"{API}/generate",
        files={"file": (name, template)},
        data={"rows": rows, "filename_key": key},
    )


def test_extract(client, template):
    res = client.post(f"{API}/extract", files={"file": ("tpl.docx", template)})
    assert res.status_code == 200
    assert res.json() == {"filename": "tpl.docx", "variables": ["name", "company", "code"]}


def test_extract_rejects_bad_files(client):
    res = client.post(f"{API}/extract", files={"file": ("a.txt", b"hi")})
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")
    res = client.post(f"{API}/extract", files={"file": ("a.docx", b"not a zip")})
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")


def test_extract_rejects_zip_that_is_not_docx(client):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("hello.txt", "x")
    res = client.post(f"{API}/extract", files={"file": ("a.docx", buf.getvalue())})
    assert res.status_code == 400


def test_zip_bomb_rejected(client):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("big.bin", b"\0" * (6 * 1024 * 1024))  # > 5 MB uncompressed limit
    assert len(buf.getvalue()) < 1024 * 1024
    res = client.post(f"{API}/extract", files={"file": ("a.docx", buf.getvalue())})
    assert res.status_code == 400
    assert "unsafe size" in res.json()["detail"]


def test_upload_too_large(client):
    res = client.post(f"{API}/extract", files={"file": ("a.docx", b"0" * (1024 * 1024 + 1))})
    assert (res.status_code, res.json()["code"]) == (413, "payload_too_large")


def test_generate_single_returns_docx(client, template):
    res = post_generate(client, template, '[{"name":"Budi","company":"Acme","code":"A1"}]')
    assert res.status_code == 200
    assert "A1_tpl.docx" in res.headers["content-disposition"]
    assert res.headers["content-length"] == str(len(res.content))
    assert "Budi" in all_text(res.content)


def test_generate_multi_returns_zip(client, template):
    rows = '[{"name":"A","code":"X"},{"name":"B","code":"X"},{"name":"C","code":""}]'
    res = post_generate(client, template, rows)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    assert "text-replacer_tpl.zip" in res.headers["content-disposition"]
    with zipfile.ZipFile(io.BytesIO(res.content)) as zf:
        assert zf.namelist() == ["X_tpl.docx", "X_tpl-2.docx", "row3_tpl.docx"]
        assert "Dear B," in all_text(zf.read("X_tpl-2.docx"))


def test_generate_coerces_non_string_cells(client, template):
    res = post_generate(client, template, '[{"name":1,"code":null}]')
    assert res.status_code == 200
    assert "Dear 1," in all_text(res.content)


def test_generate_validates_rows(client, template):
    for rows, message in [
        ("not json", "JSON array"),
        ('{"a":1}', "JSON array"),
        ("[]", "at least one"),
        ("[" + ",".join(['{"a":"1"}'] * 6) + "]", "Too many rows"),
    ]:
        res = post_generate(client, template, rows)
        assert (res.status_code, res.json()["code"]) == (400, "invalid_rows")
        assert message in res.json()["detail"]


def test_response_headers(client):
    res = client.get("/api/health")
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-request-id"]


def test_parse_csv_semicolon(client):
    res = client.post(
        f"{API}/parse-table", files={"file": ("d.csv", b"name;code\nBudi;1\n;\nSari;2\n")}
    )
    assert res.json() == {
        "columns": ["name", "code"],
        "rows": [{"name": "Budi", "code": "1"}, {"name": "Sari", "code": "2"}],
    }


def test_parse_xlsx(client):
    wb = Workbook()
    wb.active.append(["name", "code"])
    wb.active.append(["Budi", 1.0])
    buf = io.BytesIO()
    wb.save(buf)
    res = client.post(f"{API}/parse-table", files={"file": ("d.xlsx", buf.getvalue())})
    assert res.json()["rows"] == [{"name": "Budi", "code": "1"}]


def test_parse_table_limits_and_errors(client):
    many = "a\n" + "x\n" * 6  # max_rows is 5 in test settings
    res = client.post(f"{API}/parse-table", files={"file": ("d.csv", many.encode())})
    assert (res.status_code, res.json()["code"]) == (400, "invalid_table")
    res = client.post(f"{API}/parse-table", files={"file": ("d.csv", b"")})
    assert res.status_code == 400
    res = client.post(f"{API}/parse-table", files={"file": ("d.xls", b"x")})
    assert res.status_code == 400
