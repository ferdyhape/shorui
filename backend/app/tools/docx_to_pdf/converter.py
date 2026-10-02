"""Convert a .docx to .pdf via a headless LibreOffice subprocess.

LibreOffice is the only reliable cross-platform way to render a .docx exactly as Word would
(fonts, layout, fields) without reimplementing a layout engine. Each call gets its own
temp profile dir (`-env:UserInstallation=...`) so concurrent conversions never collide on
LibreOffice's single-instance lock.
"""

import shutil
import subprocess
from pathlib import Path

from app.core.config import Settings
from app.core.errors import ConversionError, ServiceUnavailableError

# Common install locations, checked when `soffice`/`libreoffice` isn't on PATH.
_CANDIDATES = (
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/opt/libreoffice/program/soffice",
)


def resolve_soffice(settings: Settings) -> str:
    if settings.soffice_path:
        if Path(settings.soffice_path).is_file():
            return settings.soffice_path
        raise ServiceUnavailableError(f"Configured soffice path not found: {settings.soffice_path}")
    found = shutil.which("soffice") or shutil.which("libreoffice")
    if found:
        return found
    for candidate in _CANDIDATES:
        if Path(candidate).is_file():
            return candidate
    raise ServiceUnavailableError(
        "LibreOffice is not installed on the server. "
        "Install it, or point SHORUI_SOFFICE_PATH at soffice."
    )


def convert_to_pdf(data: bytes, settings: Settings, tmp_root: Path) -> bytes:
    """Run the conversion inside `tmp_root` (caller owns its lifetime/cleanup)."""
    soffice = resolve_soffice(settings)
    src = tmp_root / "input.docx"
    src.write_bytes(data)
    profile_dir = tmp_root / "profile"

    try:
        proc = subprocess.run(  # noqa: S603 - soffice path is resolved above, never from user input
            [
                soffice,
                "--headless",
                "--norestore",
                "--nolockcheck",
                "--nodefault",
                f"-env:UserInstallation={profile_dir.as_uri()}",
                "--convert-to",
                "pdf",
                "--outdir",
                str(tmp_root),
                str(src),
            ],
            capture_output=True,
            timeout=settings.conversion_timeout_seconds,
        )
    except FileNotFoundError as exc:
        raise ServiceUnavailableError(f"Cannot run soffice: {exc}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ConversionError("Conversion timed out") from exc

    out = tmp_root / "input.pdf"
    if proc.returncode != 0 or not out.is_file():
        stderr = proc.stderr.decode("utf-8", "replace").strip()
        detail = f": {stderr[:300]}" if stderr else ""
        raise ConversionError(f"LibreOffice failed to convert the document{detail}")
    return out.read_bytes()
