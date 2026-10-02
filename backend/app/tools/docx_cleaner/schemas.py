from app.core.errors import InvalidRowsError
from app.tools.docx_cleaner.docx_service import CleanOptions


def parse_options(
    strip_properties: bool, strip_comments: bool, accept_revisions: bool
) -> CleanOptions:
    if not (strip_properties or strip_comments or accept_revisions):
        raise InvalidRowsError("Select at least one cleaning option")
    return CleanOptions(
        strip_properties=strip_properties,
        strip_comments=strip_comments,
        accept_revisions=accept_revisions,
    )
