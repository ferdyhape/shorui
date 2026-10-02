"""Find and replace {{variable}} placeholders in .docx files.

The run-splitting and header/footer/table walk live in `app.core.docx_runs`, shared with
`bulk_replace`; this module only owns the {{variable}} regex and output naming.
"""

import re

from app.core import docx_runs
from app.core.naming import dedupe_names, safe_name
from app.core.output import DOCX_MIME, ZIP_MIME, GeneratedFile, single_file, zip_files

__all__ = ["DOCX_MIME", "ZIP_MIME", "GeneratedFile"]

VAR_RE = re.compile(r"\{\{\s*([^{}]+?)\s*\}\}")
TOOL_SLUG = "text-replacer"


def extract_variables(data: bytes) -> list[str]:
    """Unique variable names, in order of first appearance."""
    doc = docx_runs.load_docx(data)
    found: dict[str, None] = {}
    for paragraph in docx_runs.paragraphs(doc):
        for m in VAR_RE.finditer(docx_runs.joined_text(paragraph)):
            found.setdefault(m.group(1), None)
    return list(found)


def render(data: bytes, values: dict[str, str]) -> bytes:
    """Fill placeholders. Variables missing from `values` become empty."""
    doc = docx_runs.load_docx(data)
    docx_runs.render_all(
        doc, VAR_RE, lambda m: docx_runs.ILLEGAL_XML_RE.sub("", values.get(m.group(1), ""))
    )
    return docx_runs.save(doc)


def template_stem(template_name: str) -> str:
    return safe_name(re.sub(r"\.docx$", "", template_name, flags=re.IGNORECASE)) or "document"


def zip_name(template_name: str) -> str:
    """Archive name: <tool>_<template name>.zip, e.g. text-replacer_offer-letter.zip."""
    return f"{TOOL_SLUG}_{template_stem(template_name)}.zip"


def output_names(
    template_name: str, rows: list[dict[str, str]], filename_key: str | None
) -> list[str]:
    """One file name per row: <key value>_<template name>.docx (or <name>_<n>); deduped."""
    stem = template_stem(template_name)
    raw = []
    for index, row in enumerate(rows, start=1):
        if filename_key:
            prefix = safe_name(row.get(filename_key, "").strip()) or f"row{index}"
            raw.append(f"{prefix}_{stem}.docx")
        else:
            raw.append(f"{stem}_{index}.docx")
    return dedupe_names(raw)


def generate(
    template_name: str,
    data: bytes,
    rows: list[dict[str, str]],
    filename_key: str | None,
) -> GeneratedFile:
    """Render one document per row. Several rows are zipped so memory stays bounded."""
    names = output_names(template_name, rows, filename_key)
    if len(rows) == 1:
        return single_file(names[0], DOCX_MIME, render(data, rows[0]))
    files = [(name, render(data, row)) for name, row in zip(names, rows, strict=True)]
    return zip_files(zip_name(template_name), files)
