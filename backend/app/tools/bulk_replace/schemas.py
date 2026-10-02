import json
from typing import Annotated

from pydantic import BeforeValidator, TypeAdapter, ValidationError

from app.core.config import Settings
from app.core.errors import InvalidRowsError


def _to_str(value: object) -> str:
    return "" if value is None else str(value)


CellValue = Annotated[str, BeforeValidator(_to_str)]
_pairs_adapter: TypeAdapter[list[tuple[CellValue, CellValue]]] = TypeAdapter(
    list[tuple[CellValue, CellValue]]
)


def parse_pairs(raw: str, settings: Settings) -> list[tuple[str, str]]:
    """Validate the `pairs` form field: a JSON array of [find, replace] tuples."""
    try:
        pairs = _pairs_adapter.validate_python(json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise InvalidRowsError("pairs must be a JSON array of [find, replace] tuples") from exc
    if not pairs:
        raise InvalidRowsError("Add at least one find/replace pair")
    if len(pairs) > settings.max_rows:
        raise InvalidRowsError(f"Too many pairs (max {settings.max_rows})")
    if any(not find.strip() for find, _ in pairs):
        raise InvalidRowsError("A find value is empty")
    limit = settings.max_cell_chars
    if any(len(find) > limit or len(repl) > limit for find, repl in pairs):
        raise InvalidRowsError(f"A value exceeds {limit} characters")
    return pairs
