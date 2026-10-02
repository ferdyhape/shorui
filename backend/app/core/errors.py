from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str
    code: str


class ShoruiError(Exception):
    """Domain error. Services raise these; the HTTP layer maps them to responses."""

    status_code = 400
    code = "bad_request"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidFileError(ShoruiError):
    code = "invalid_file"


class InvalidTableError(ShoruiError):
    code = "invalid_table"


class InvalidRowsError(ShoruiError):
    code = "invalid_rows"


class PayloadTooLargeError(ShoruiError):
    status_code = 413
    code = "payload_too_large"


class ConversionError(ShoruiError):
    """The input was valid but an external converter (e.g. LibreOffice) failed on it."""

    status_code = 422
    code = "conversion_failed"


class ServiceUnavailableError(ShoruiError):
    """A required external tool (e.g. LibreOffice) is not installed/reachable."""

    status_code = 503
    code = "service_unavailable"


async def shorui_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ShoruiError)  # noqa: S101 - narrowing for the type checker
    return JSONResponse(
        status_code=exc.status_code, content={"detail": exc.message, "code": exc.code}
    )


ERROR_RESPONSES: dict[int | str, dict[str, object]] = {
    400: {"model": ErrorResponse, "description": "Invalid input"},
    413: {"model": ErrorResponse, "description": "Upload too large"},
    422: {"model": ErrorResponse, "description": "Could not process the file"},
    503: {"model": ErrorResponse, "description": "A required external tool is unavailable"},
}
