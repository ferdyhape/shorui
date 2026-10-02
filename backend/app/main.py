import logging

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import ShoruiError, shorui_error_handler
from app.core.middleware import request_context
from app.tools.bulk_replace.router import router as bulk_replace_router
from app.tools.docx_cleaner.router import router as docx_cleaner_router
from app.tools.docx_to_pdf.router import router as docx_to_pdf_router
from app.tools.image_to_pdf.router import router as image_to_pdf_router
from app.tools.pdf_compress.router import router as pdf_compress_router
from app.tools.pdf_stamp.router import router as pdf_stamp_router
from app.tools.pdf_tools.router import router as pdf_tools_router
from app.tools.text_replacer.router import router as text_replacer_router


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level.upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    app = FastAPI(title="Shorui API", version="1.0.0")
    app.add_exception_handler(ShoruiError, shorui_error_handler)
    app.middleware("http")(request_context)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        expose_headers=["Content-Disposition", "X-Original-Size", "X-Compressed-Size"],
    )

    # Each tool = one router. Register new tools here.
    v1 = APIRouter(prefix="/api/v1")
    v1.include_router(text_replacer_router)
    v1.include_router(pdf_tools_router)
    v1.include_router(docx_to_pdf_router)
    v1.include_router(bulk_replace_router)
    v1.include_router(docx_cleaner_router)
    v1.include_router(pdf_compress_router)
    v1.include_router(pdf_stamp_router)
    v1.include_router(image_to_pdf_router)
    app.include_router(v1)

    @app.get("/api/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
