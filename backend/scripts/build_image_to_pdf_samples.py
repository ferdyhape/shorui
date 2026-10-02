"""Regenerate the downloadable Image to PDF samples.

    cd backend && .venv/Scripts/python scripts/build_image_to_pdf_samples.py

Two small labelled JPEGs so trying the tool shows a real multi-image, multi-page result.
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "app" / "tools" / "image_to_pdf" / "samples"


def make_photo(label: str, color: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (600, 400), color)
    draw = ImageDraw.Draw(image)
    draw.rectangle([20, 20, 580, 380], outline=(255, 255, 255), width=4)
    draw.text((40, 40), label, fill=(255, 255, 255))
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_photo("Sample photo 1", (0, 90, 160)).save(OUT / "sample-1.jpg", quality=90)
    make_photo("Sample photo 2", (160, 60, 0)).save(OUT / "sample-2.jpg", quality=90)
    print(f"Wrote {OUT} (sample-1.jpg, sample-2.jpg)")


if __name__ == "__main__":
    main()
