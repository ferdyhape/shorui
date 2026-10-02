from app.core.naming import dedupe_names, safe_name


def test_safe_name_strips_invalid_characters_and_trims():
    assert safe_name('a/b:c*d?e"f<g>h|i') == "a_b_c_d_e_f_g_h_i"
    assert safe_name("  spaced.  ") == "spaced"
    assert safe_name("a" * 200) == "a" * 80


def test_dedupe_names_case_insensitive():
    assert dedupe_names(["a.docx", "A.docx", "a.docx", "b.docx"]) == [
        "a.docx",
        "A-2.docx",
        "a-3.docx",
        "b.docx",
    ]


def test_dedupe_names_without_extension():
    assert dedupe_names(["report", "report"]) == ["report", "report-2"]
