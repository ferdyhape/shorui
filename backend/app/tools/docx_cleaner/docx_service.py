"""Strip personal metadata, comments and tracked changes from a .docx before sharing it.

Properties are cleared through python-docx's own API; comments and tracked changes have no
such API, so this walks the raw XML trees via `core.docx_runs.roots()` (the same body + header/
footer roots every docx-editing tool uses) and removes the relevant elements directly.
"""

import re
from dataclasses import dataclass
from typing import Any

from docx.oxml.ns import qn

from app.core import docx_runs
from app.core.naming import safe_name
from app.core.output import DOCX_MIME, GeneratedFile, single_file

__all__ = ["DOCX_MIME", "GeneratedFile"]

_PROPERTY_FIELDS = (
    "author",
    "category",
    "comments",
    "content_status",
    "identifier",
    "keywords",
    "language",
    "last_modified_by",
    "subject",
    "title",
    "version",
)

_UNWRAP_TAGS = {qn("w:ins"), qn("w:moveTo")}
_REMOVE_TAGS = {qn("w:del"), qn("w:moveFrom")}
_REMOVE_METADATA_TAGS = {
    qn(t)
    for t in (
        "w:pPrChange",
        "w:rPrChange",
        "w:sectPrChange",
        "w:tblPrChange",
        "w:tblGridChange",
        "w:tcPrChange",
        "w:trPrChange",
    )
}
_COMMENT_ANCHOR_TAGS = {
    qn(t) for t in ("w:commentRangeStart", "w:commentRangeEnd", "w:commentReference")
}


@dataclass(frozen=True)
class CleanOptions:
    strip_properties: bool = True
    strip_comments: bool = True
    accept_revisions: bool = True


def _unwrap(element: Any) -> None:
    """Replace `element` with its own children, in place."""
    parent = element.getparent()
    if parent is None:
        return
    index = list(parent).index(element)
    for child in list(element):
        element.remove(child)
        parent.insert(index, child)
        index += 1
    parent.remove(element)


def _strip_properties(doc: Any) -> None:
    props = doc.core_properties
    for field in _PROPERTY_FIELDS:
        setattr(props, field, "")
    props.revision = 1


def _accept_revisions(doc: Any) -> None:
    """Keep every insertion's text, drop every deletion's text, drop change-tracking metadata."""
    for root in docx_runs.roots(doc):
        elements = list(root.iter())  # snapshot: safe to mutate the tree while walking this
        for element in elements:
            if element.tag in _UNWRAP_TAGS:
                _unwrap(element)
            elif element.tag in _REMOVE_TAGS or element.tag in _REMOVE_METADATA_TAGS:
                parent = element.getparent()
                if parent is not None:
                    parent.remove(element)


def _strip_comment_anchors(doc: Any) -> None:
    """Remove the markers that highlight commented text and show the comment bubble.

    Does not remove the comments.xml part itself (python-docx exposes no API for that); an
    orphaned, unreferenced comments part is harmless - Word simply shows nothing for it.
    """
    for root in docx_runs.roots(doc):
        for element in list(root.iter()):
            if element.tag in _COMMENT_ANCHOR_TAGS:
                parent = element.getparent()
                if parent is not None:
                    parent.remove(element)


def clean(data: bytes, options: CleanOptions) -> bytes:
    doc = docx_runs.load_docx(data)
    if options.strip_properties:
        _strip_properties(doc)
    if options.accept_revisions:
        _accept_revisions(doc)
    if options.strip_comments:
        _strip_comment_anchors(doc)
    return docx_runs.save(doc)


def output_name(original_name: str) -> str:
    stem = safe_name(re.sub(r"\.docx$", "", original_name, flags=re.IGNORECASE)) or "document"
    return f"{stem}-cleaned.docx"


def process(original_name: str, data: bytes, options: CleanOptions) -> GeneratedFile:
    cleaned = clean(data, options)
    return single_file(output_name(original_name), DOCX_MIME, cleaned)
