"""Shared file-output plumbing: a single file or a zip, streamed to the client.

Every tool returns a `GeneratedFile` from its service layer; the router streams it with
`stream_and_close` + `content_disposition`. Multi-file results are written to a spooled
temp file (spills to disk past a size threshold) so memory use stays bounded however many
files are produced.
"""

import zipfile
from collections.abc import Iterator
from dataclasses import dataclass
from io import BytesIO
from tempfile import SpooledTemporaryFile
from typing import IO
from urllib.parse import quote

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PDF_MIME = "application/pdf"
ZIP_MIME = "application/zip"

_ZIP_SPOOL_BYTES = 8 * 1024 * 1024
_READ_CHUNK = 64 * 1024


@dataclass
class GeneratedFile:
    filename: str
    media_type: str
    content: IO[bytes]  # positioned at 0; stream_and_close() closes it
    size: int


def single_file(filename: str, media_type: str, data: bytes) -> GeneratedFile:
    return GeneratedFile(filename, media_type, BytesIO(data), len(data))


def zip_files(zip_filename: str, files: list[tuple[str, bytes]]) -> GeneratedFile:
    spool = SpooledTemporaryFile(max_size=_ZIP_SPOOL_BYTES)  # noqa: SIM115 - closed downstream
    try:
        with zipfile.ZipFile(spool, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, content in files:
                zf.writestr(name, content)
        size = spool.tell()
        spool.seek(0)
    except BaseException:
        spool.close()
        raise
    return GeneratedFile(zip_filename, ZIP_MIME, spool, size)


def stream_and_close(content: IO[bytes]) -> Iterator[bytes]:
    try:
        while chunk := content.read(_READ_CHUNK):
            yield chunk
    finally:
        content.close()


def content_disposition(filename: str) -> dict[str, str]:
    return {"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"}
