import io

from docx import Document

from app.tools.text_replacer import docx_service
from tests.conftest import all_text


def test_extract_unique_ordered(template):
    assert docx_service.extract_variables(template) == ["name", "company", "code"]


def test_render_split_runs_table_header(template):
    out = docx_service.render(template, {"name": "Budi", "company": "Acme", "code": "A1"})
    text = all_text(out)
    assert "Dear Budi, welcome to Acme." in text
    assert "Code: A1 / Budi" in text
    assert "Header Acme" in text
    assert "{{" not in text


def test_missing_value_becomes_empty(template):
    assert "Code:  / X" in all_text(docx_service.render(template, {"name": "X"}))


def test_illegal_xml_characters_are_stripped(template):
    out = docx_service.render(template, {"name": "a\x00b\x0bc"})
    assert "Dear abc," in all_text(out)


def test_newline_becomes_line_break(template):
    out = docx_service.render(template, {"name": "line1\nline2"})
    doc = Document(io.BytesIO(out))
    assert "Dear line1\nline2," in doc.paragraphs[0].text


def test_output_names_prefix_dedupe_and_sanitize():
    rows = [{"k": "X"}, {"k": "x"}, {"k": ""}, {"k": "a/b:c"}]
    assert docx_service.output_names("tpl.docx", rows, "k") == [
        "X_tpl.docx",
        "x_tpl-2.docx",
        "row3_tpl.docx",
        "a_b_c_tpl.docx",
    ]
    assert docx_service.output_names("tpl.docx", rows[:2], None) == ["tpl_1.docx", "tpl_2.docx"]


def test_zip_name_uses_tool_and_template_name():
    assert docx_service.zip_name("Offer Letter.docx") == "text-replacer_Offer Letter.zip"
    assert docx_service.zip_name("a/b:c.DOCX") == "text-replacer_a_b_c.zip"
    assert docx_service.zip_name(".docx") == "text-replacer_document.zip"
