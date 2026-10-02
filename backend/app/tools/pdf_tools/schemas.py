import json
from typing import Annotated

from pydantic import BaseModel, Field, TypeAdapter, ValidationError

from app.core.config import Settings
from app.core.errors import InvalidRowsError
from app.tools.pdf_tools.pdf_service import PageOp


class FileInfo(BaseModel):
    filename: str
    page_count: int


class InspectResponse(BaseModel):
    files: list[FileInfo]


class PlanOp(BaseModel):
    file_index: Annotated[int, Field(ge=0)]
    page_index: Annotated[int, Field(ge=0)]
    rotate: Annotated[int, Field(default=0)]

    def to_op(self) -> PageOp:
        return PageOp(self.file_index, self.page_index, self.rotate % 360)


_plan_adapter: TypeAdapter[list[PlanOp]] = TypeAdapter(list[PlanOp])


def parse_plan(raw: str, file_count: int, settings: Settings) -> list[PageOp]:
    """Validate the `plan` form field: a JSON array of {file_index, page_index, rotate}."""
    try:
        ops = _plan_adapter.validate_python(json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise InvalidRowsError("plan must be a JSON array of page operations") from exc
    if not ops:
        raise InvalidRowsError("Add at least one page to the output")
    if len(ops) > settings.max_pdf_pages:
        raise InvalidRowsError(f"Too many pages (max {settings.max_pdf_pages})")
    for op in ops:
        if op.file_index >= file_count:
            raise InvalidRowsError(f"Page references an unknown file (index {op.file_index})")
        if op.rotate % 90 != 0:
            raise InvalidRowsError(f"rotate must be a multiple of 90, got {op.rotate}")
    return [op.to_op() for op in ops]
