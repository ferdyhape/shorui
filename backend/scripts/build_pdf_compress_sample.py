"""Regenerate the downloadable PDF Compress sample.

    cd backend && .venv/Scripts/python scripts/build_pdf_compress_sample.py

A photo-like (high-entropy, noisy) image compresses poorly at high JPEG quality and well at
low quality, so this file shows a real, visible size reduction - a flat/text-only PDF would not.
"""

import random
from io import BytesIO
from pathlib import Path

from PIL import Image
from pypdf import PdfWriter

from app.core.pdf_images import add_image_page

OUT = Path(__file__).resolve().parent.parent / "app" / "tools" / "pdf_compress" / "samples"


def _noisy_photo(seed: int, size: tuple[int, int] = (1000, 700)) -> bytes:
    rng = random.Random(seed)  # noqa: S311 - sample image content, not security-sensitive
    image = Image.new("RGB", size)
    # Per-pixel random colour approximates a busy photo: no flat regions for JPEG to exploit.
    image.putdata(
        [
            (rng.randrange(256), rng.randrange(256), rng.randrange(256))
            for _ in range(size[0] * size[1])
        ]
    )
    buf = BytesIO()
    image.save(buf, format="JPEG", quality=95)  # high quality in: plenty of room to compress
    return buf.getvalue()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    writer = PdfWriter()
    add_image_page(writer, _noisy_photo(1))
    add_image_page(writer, _noisy_photo(2))
    path = OUT / "sample-photo.pdf"
    with path.open("wb") as fh:
        writer.write(fh)
    print(f"Wrote {path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
