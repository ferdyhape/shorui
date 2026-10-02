from app.core.config import Settings
from app.core.errors import InvalidRowsError


def parse_options(
    watermark_text: str | None, page_numbers: bool, settings: Settings
) -> tuple[str | None, bool]:
    text = (watermark_text or "").strip() or None
    if not (text or page_numbers):
        raise InvalidRowsError("Enter watermark text or enable page numbers")
    if text and len(text) > settings.max_stamp_text_chars:
        raise InvalidRowsError(f"Watermark text exceeds {settings.max_stamp_text_chars} characters")
    return text, page_numbers
