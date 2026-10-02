import io

import pytest
from PIL import Image
from pypdf import PdfReader

from app.core.errors import InvalidFileError
from app.tools.image_to_pdf import image_service

API = "/api/v1/image-to-pdf"


def make_image(color: tuple[int, int, int], fmt: str = "PNG", size=(300, 200)) -> bytes:
    image = Image.new("RGB", size, color)
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return buf.getvalue()


def test_build_one_page_per_image():
    result = image_service.build([make_image((255, 0, 0)), make_image((0, 255, 0))], "out.pdf")
    reader = PdfReader(io.BytesIO(result.content.read()))
    assert len(reader.pages) == 2


def test_build_preserves_aspect_ratio():
    result = image_service.build([make_image((0, 0, 255), size=(600, 300))], "out.pdf")
    page = PdfReader(io.BytesIO(result.content.read())).pages[0]
    assert round(float(page.mediabox.width) / float(page.mediabox.height), 2) == 2.0


def test_build_accepts_png_with_transparency():
    image = Image.new("RGBA", (100, 100), (255, 0, 0, 128))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    result = image_service.build([buf.getvalue()], "out.pdf")
    assert len(PdfReader(io.BytesIO(result.content.read())).pages) == 1


def test_build_rejects_empty_list():
    with pytest.raises(InvalidFileError):
        image_service.build([], "out.pdf")


def test_build_rejects_invalid_image():
    with pytest.raises(InvalidFileError):
        image_service.build([b"not an image"], "out.pdf")


def test_output_name_sanitized_and_extensioned():
    result = image_service.build([make_image((1, 2, 3))], "a/b")
    assert result.filename == "a_b.pdf"


def test_api_build_endpoint(client):
    res = client.post(
        f"{API}/build",
        files=[
            ("files", ("a.png", make_image((255, 0, 0)), "image/png")),
            ("files", ("b.jpg", make_image((0, 255, 0), fmt="JPEG"), "image/jpeg")),
        ],
        data={"output_name": "album.pdf"},
    )
    assert res.status_code == 200
    assert "album.pdf" in res.headers["content-disposition"]
    assert len(PdfReader(io.BytesIO(res.content)).pages) == 2


def test_api_rejects_unsupported_extension(client):
    res = client.post(
        f"{API}/build", files=[("files", ("a.docx", b"hi", "application/octet-stream"))]
    )
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")


def test_api_rejects_too_many_files(client):
    # settings fixture caps max_files at 3
    files = [("files", (f"{i}.png", make_image((i, i, i)), "image/png")) for i in range(4)]
    res = client.post(f"{API}/build", files=files)
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")


def test_download_samples(client):
    for name in ("sample-1.jpg", "sample-2.jpg"):
        res = client.get(f"{API}/samples/{name}")
        assert res.status_code == 200
        assert name in res.headers["content-disposition"]


def test_download_sample_rejects_unknown_name(client):
    assert client.get(f"{API}/samples/secret.jpg").status_code == 422
