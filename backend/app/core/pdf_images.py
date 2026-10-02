"""Embed a raster image as a full PDF page.

pypdf has no "image to PDF page" helper - a PDF image is a plain XObject stream, and a JPEG's
own bytes are a valid `/DCTDecode` stream with no re-encoding of the pixel data required. Pillow
only normalizes the input (any format, including transparency) into one JPEG; the PDF structure
itself is built with pypdf's low-level generic objects, same pattern as `pdf_text.py`.
"""

from io import BytesIO

from PIL import Image
from PIL import UnidentifiedImageError as PILUnidentifiedImageError
from pypdf import PdfWriter
from pypdf._page import PageObject
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject, NumberObject

from app.core.errors import InvalidFileError

# Cap the page's longest side so a huge photo doesn't produce an oversized PDF page.
MAX_POINTS = 1500


def _load_image(data: bytes) -> Image.Image:
    try:
        opened = Image.open(BytesIO(data))
        opened.load()
    except (PILUnidentifiedImageError, OSError) as exc:
        raise InvalidFileError("File is not a valid image") from exc
    image: Image.Image = opened
    if image.mode not in ("RGB", "L"):
        # Flatten transparency (PNG/WebP) onto white - a PDF image has no alpha channel here.
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image.convert("RGBA"), mask=image.convert("RGBA").split()[-1])
        image = background
    return image


def add_image_page(writer: PdfWriter, data: bytes, *, jpeg_quality: int = 88) -> PageObject:
    """Append one page sized to the image's aspect ratio, filled with the image."""
    image = _load_image(data)
    width_px, height_px = image.size
    scale = MAX_POINTS / max(width_px, height_px)
    width, height = width_px * scale, height_px * scale

    buf = BytesIO()
    image.save(buf, format="JPEG", quality=jpeg_quality)
    jpeg_bytes = buf.getvalue()

    page = writer.add_blank_page(width=width, height=height)

    xobject = DecodedStreamObject()
    xobject.set_data(jpeg_bytes)
    xobject[NameObject("/Type")] = NameObject("/XObject")
    xobject[NameObject("/Subtype")] = NameObject("/Image")
    xobject[NameObject("/Width")] = NumberObject(width_px)
    xobject[NameObject("/Height")] = NumberObject(height_px)
    xobject[NameObject("/ColorSpace")] = NameObject(
        "/DeviceGray" if image.mode == "L" else "/DeviceRGB"
    )
    xobject[NameObject("/BitsPerComponent")] = NumberObject(8)
    xobject[NameObject("/Filter")] = NameObject("/DCTDecode")
    xobject_ref = writer._add_object(xobject)

    resources = DictionaryObject()
    xobjects = DictionaryObject()
    xobjects[NameObject("/Im1")] = xobject_ref
    resources[NameObject("/XObject")] = xobjects
    page[NameObject("/Resources")] = resources

    content = DecodedStreamObject()
    content.set_data(f"q {width} 0 0 {height} 0 0 cm /Im1 Do Q".encode())
    page[NameObject("/Contents")] = writer._add_object(content)
    return page
