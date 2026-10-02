"""Plain-text find & replace across one or more .docx files (no {{variable}} syntax).

Reuses the run-splitting engine from `app.core.docx_runs` (same one `text_replacer` uses):
a search term can itself be split across runs by Word, so matching happens on each
paragraph's joined text exactly like variable substitution does.
"""

import re

from app.core import docx_runs
from app.core.naming import dedupe_names, safe_name
from app.core.output import DOCX_MIME, ZIP_MIME, GeneratedFile, single_file, zip_files

__all__ = ["DOCX_MIME", "ZIP_MIME", "GeneratedFile"]

TOOL_SLUG = "bulk-replace"


def build_pattern(pairs: list[tuple[str, str]]) -> tuple[re.Pattern[str], dict[str, str]]:
    """One alternation regex matching any `find` term; longest first so overlapping terms
    (e.g. "Order" and "Order ID") don't get shadowed by the shorter one."""
    by_find = dict(pairs)  # later duplicates win, same as a dict literal would
    terms = sorted(by_find, key=len, reverse=True)
    pattern = re.compile("|".join(re.escape(t) for t in terms))
    return pattern, by_find


def replace(data: bytes, pattern: re.Pattern[str], by_find: dict[str, str]) -> bytes:
    doc = docx_runs.load_docx(data)
    docx_runs.render_all(
        doc, pattern, lambda m: docx_runs.ILLEGAL_XML_RE.sub("", by_find[m.group(0)])
    )
    return docx_runs.save(doc)


def output_names(filenames: list[str]) -> list[str]:
    return dedupe_names([safe_name(name) or "document.docx" for name in filenames])


def zip_name(file_count: int) -> str:
    return f"{TOOL_SLUG}_{file_count}-files.zip"


def process(files: list[tuple[str, bytes]], pairs: list[tuple[str, str]]) -> GeneratedFile:
    """Apply the same find/replace pairs to every file. One input -> one .docx, else a .zip."""
    pattern, by_find = build_pattern(pairs)
    names = output_names([name for name, _ in files])
    if len(files) == 1:
        (_, data), name = files[0], names[0]
        return single_file(name, DOCX_MIME, replace(data, pattern, by_find))
    rendered = [
        (name, replace(data, pattern, by_find))
        for name, (_, data) in zip(names, files, strict=True)
    ]
    return zip_files(zip_name(len(files)), rendered)
