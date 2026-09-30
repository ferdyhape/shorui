import json
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, TypeAdapter, ValidationError

from app.core.config import Settings
from app.core.errors import InvalidRowsError


class ExtractResponse(BaseModel):
    filename: str
    variables: list[str]


class ParseTableResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, str]]


def _to_str(value: object) -> str:
    return "" if value is None else str(value)


# Clients may send numbers/null for cells; normalise everything to text.
CellValue = Annotated[str, BeforeValidator(_to_str)]
_rows_adapter: TypeAdapter[list[dict[str, CellValue]]] = TypeAdapter(list[dict[str, CellValue]])


def parse_rows(raw: str, settings: Settings) -> list[dict[str, str]]:
    """Validate the `rows` form field (a JSON array of objects)."""
    try:
        rows = _rows_adapter.validate_python(json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise InvalidRowsError("rows must be a JSON array of objects") from exc
    if not rows:
        raise InvalidRowsError("Add at least one row")
    if len(rows) > settings.max_rows:
        raise InvalidRowsError(f"Too many rows (max {settings.max_rows})")
    if any(len(v) > settings.max_cell_chars for row in rows for v in row.values()):
        raise InvalidRowsError(f"A cell exceeds {settings.max_cell_chars} characters")
    return rows
