import zipfile
from io import BytesIO

from fastapi import UploadFile

from app.core.config import Settings
from app.core.errors import InvalidFileError, PayloadTooLargeError


def require_extension(file: UploadFile, *extensions: str) -> str:
    name = file.filename or ""
    if not name.lower().endswith(extensions):
        allowed = ", ".join(extensions)
        raise InvalidFileError(f"Unsupported file type. Allowed: {allowed}")
    return name


async def read_upload(file: UploadFile, settings: Settings) -> bytes:
    """Read at most max_upload_bytes; never buffers an unbounded body."""
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise PayloadTooLargeError(f"File exceeds {settings.max_upload_mb} MB limit")
    return data


def ensure_zip_safe(data: bytes, settings: Settings) -> None:
    """Reject zip bombs. docx and xlsx are ZIP containers; check before parsing them."""
    try:
        with zipfile.ZipFile(BytesIO(data)) as zf:
            infos = zf.infolist()
    except zipfile.BadZipFile as exc:
        raise InvalidFileError("File is not a valid Office document") from exc
    if len(infos) > settings.max_zip_entries:
        raise InvalidFileError("Document contains too many parts")
    if sum(i.file_size for i in infos) > settings.max_uncompressed_bytes:
        raise InvalidFileError("Document expands to an unsafe size")
