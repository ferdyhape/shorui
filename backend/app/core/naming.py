"""Output file naming shared by every tool that writes files back to the user."""

import re

_INVALID_FILENAME = re.compile(r'[\\/:*?"<>|\x00-\x1f]')


def safe_name(text: str) -> str:
    """Strip characters a filesystem/zip entry can't hold; cap length."""
    return _INVALID_FILENAME.sub("_", text).strip(" .")[:80]


def dedupe_names(names: list[str]) -> list[str]:
    """Case-insensitive de-dup: a repeated "a.docx" becomes "a-2.docx", "a-3.docx", ..."""
    used: set[str] = set()
    out = []
    for name in names:
        stem, dot, ext = name.rpartition(".")
        candidate, n = name, 2
        while candidate.lower() in used:
            candidate = f"{stem}-{n}{dot}{ext}" if dot else f"{name}-{n}"
            n += 1
        used.add(candidate.lower())
        out.append(candidate)
    return out
