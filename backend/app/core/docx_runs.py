"""Shared machinery for editing .docx text while respecting Word's run-splitting.

Word can split one logical string across several <w:t> runs (e.g. after spellcheck or
partial formatting), so matching must happen on each paragraph's *joined* text, then write
values back into the runs that text actually spans. `render_all` is the entry point every
docx-editing tool uses; `paragraphs()` is the root iterator that reaches every editable
paragraph (body, nested tables, text boxes, headers, footers).
"""

import re
import zipfile
from collections.abc import Callable, Iterator
from io import BytesIO
from typing import Any

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from lxml import etree

from app.core.errors import InvalidFileError

_XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
_W_P = qn("w:p")
_W_T = qn("w:t")
# Characters XML 1.0 cannot represent; lxml raises ValueError if they reach a node.
ILLEGAL_XML_RE = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\ud800-\udfff￾￿]")


def load_docx(data: bytes) -> Any:
    try:
        return Document(BytesIO(data))
    except (
        PackageNotFoundError,
        zipfile.BadZipFile,
        KeyError,
        ValueError,
        AttributeError,
        etree.XMLSyntaxError,
    ) as exc:
        raise InvalidFileError("File is not a valid .docx document") from exc


def _roots(doc: Any) -> Iterator[Any]:
    """Body plus every distinct header/footer part."""
    yield doc.element.body
    seen: set[int] = set()
    for section in doc.sections:
        parts = (
            section.header,
            section.first_page_header,
            section.even_page_header,
            section.footer,
            section.first_page_footer,
            section.even_page_footer,
        )
        for part in parts:
            if part.is_linked_to_previous:
                continue
            element = part._element  # python-docx exposes no public accessor
            if id(element) in seen:
                continue
            seen.add(id(element))
            yield element


def paragraphs(doc: Any) -> Iterator[Any]:
    # Iterating w:p covers body, nested tables and text boxes.
    for root in _roots(doc):
        yield from root.iter(_W_P)


def text_nodes(paragraph: Any) -> list[Any]:
    """w:t nodes owned by this paragraph (not by a nested text-box paragraph)."""
    nodes = []
    for t in paragraph.iter(_W_T):
        owner = t.getparent()
        while owner is not None and owner.tag != _W_P:
            owner = owner.getparent()
        if owner is paragraph:
            nodes.append(t)
    return nodes


def joined_text(paragraph: Any) -> str:
    return "".join(t.text or "" for t in text_nodes(paragraph))


def write_text(node: Any, text: str) -> None:
    """Set node text; newlines become <w:br/> so Word shows real line breaks."""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    node.text = lines[0]
    node.set(_XML_SPACE, "preserve")
    anchor = node
    for line in lines[1:]:
        br = OxmlElement("w:br")
        t = OxmlElement("w:t")
        t.text = line
        t.set(_XML_SPACE, "preserve")
        anchor.addnext(br)
        br.addnext(t)
        anchor = t


def replace_matches(
    paragraph: Any,
    matches: list[re.Match[str]],
    value_for: Callable[[re.Match[str]], str],
) -> None:
    """Replace each match's span with `value_for(match)`, across however many runs it spans."""
    nodes = text_nodes(paragraph)
    if not nodes or not matches:
        return
    original = [n.text or "" for n in nodes]
    texts = list(original)
    lengths = [len(t) for t in original]
    starts = []
    pos = 0
    for length in lengths:
        starts.append(pos)
        pos += length

    # Reverse order keeps earlier offsets valid while text changes.
    for m in reversed(matches):
        s, e = m.span()
        value = value_for(m)
        hit = [i for i in range(len(nodes)) if starts[i] + lengths[i] > s and starts[i] < e]
        if not hit:
            continue
        first, last = hit[0], hit[-1]
        prefix = texts[first][: s - starts[first]]
        suffix = texts[last][e - starts[last] :]
        if first == last:
            texts[first] = prefix + value + suffix
        else:
            texts[first] = prefix + value
            for i in hit[1:-1]:
                texts[i] = ""
            texts[last] = suffix

    for node, old, new in zip(nodes, original, texts, strict=True):
        if new != old:
            write_text(node, new)


def render_all(
    doc: Any,
    pattern: re.Pattern[str],
    value_for: Callable[[re.Match[str]], str],
) -> None:
    """Find `pattern` in every paragraph's joined text and replace each match via `value_for`."""
    for paragraph in paragraphs(doc):
        matches = list(pattern.finditer(joined_text(paragraph)))
        if matches:
            replace_matches(paragraph, matches, value_for)


def save(doc: Any) -> bytes:
    out = BytesIO()
    doc.save(out)
    return out.getvalue()
