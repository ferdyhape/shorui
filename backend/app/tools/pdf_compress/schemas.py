from app.core.errors import InvalidRowsError

MIN_QUALITY = 10
MAX_QUALITY = 95


def parse_quality(quality: int) -> int:
    if not (MIN_QUALITY <= quality <= MAX_QUALITY):
        raise InvalidRowsError(f"quality must be between {MIN_QUALITY} and {MAX_QUALITY}")
    return quality
