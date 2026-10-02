import io
import random

import pytest
from PIL import Image
from pypdf import PdfReader, PdfWriter

from app.core.errors import InvalidFileError
from app.core.pdf_images import add_image_page
from app.tools.pdf_compress import pdf_service

API = "/api/v1/pdf-compress"


def noisy_pdf(seed: int = 1, size: tuple[int, int] = (400, 300)) -> bytes:
    rng = random.Random(seed)  # noqa: S311 - test fixture content, not security-sensitive
    image = Image.new("RGB", size)
    image.putdata(
        [
            (rng.randrange(256), rng.randrange(256), rng.randrange(256))
            for _ in range(size[0] * size[1])
        ]
    )
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=95)

    writer = PdfWriter()
    add_image_page(writer, buf.getvalue())
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def test_compress_shrinks_a_noisy_image_pdf():
    data = noisy_pdf()
    result = pdf_service.compress(data, "out.pdf", quality=30)
    assert result.original_size == len(data)
    assert result.compressed_size < result.original_size
    # still a valid, readable PDF with the same page count
    assert len(PdfReader(io.BytesIO(result.file.content.read())).pages) == 1


def test_compress_rejects_invalid_pdf():
    with pytest.raises(InvalidFileError):
        pdf_service.compress(b"not a pdf", "out.pdf", quality=50)


def test_output_name_sanitized_and_extensioned():
    result = pdf_service.compress(noisy_pdf(), "a/b", quality=50)
    assert result.file.filename == "a_b.pdf"


def test_api_compress_endpoint_reports_sizes(client):
    data = noisy_pdf()
    res = client.post(
        f"{API}/compress", files={"file": ("photo.pdf", data)}, data={"quality": "30"}
    )
    assert res.status_code == 200
    assert "photo-compressed.pdf" in res.headers["content-disposition"]
    original = int(res.headers["x-original-size"])
    compressed = int(res.headers["x-compressed-size"])
    assert original == len(data)
    assert compressed < original


def test_api_rejects_quality_out_of_range(client):
    for quality in (0, 100):
        res = client.post(
            f"{API}/compress",
            files={"file": ("a.pdf", noisy_pdf())},
            data={"quality": str(quality)},
        )
        assert (res.status_code, res.json()["code"]) == (400, "invalid_rows")


def test_api_rejects_non_pdf(client):
    res = client.post(f"{API}/compress", files={"file": ("a.txt", b"hi")})
    assert (res.status_code, res.json()["code"]) == (400, "invalid_file")


def test_download_sample(client):
    res = client.get(f"{API}/samples/sample-photo.pdf")
    assert res.status_code == 200
    assert "sample-photo.pdf" in res.headers["content-disposition"]


def test_download_sample_rejects_unknown_name(client):
    assert client.get(f"{API}/samples/secret.pdf").status_code == 422
