from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Override with env vars prefixed SHORUI_ or a .env file.

    List values use JSON, e.g. SHORUI_CORS_ORIGINS='["https://tools.example.com"]'.
    """

    model_config = SettingsConfigDict(env_prefix="SHORUI_", env_file=".env", extra="ignore")

    max_upload_mb: int = Field(20, ge=1)
    max_uncompressed_mb: int = Field(100, ge=1)  # zip-bomb guard for docx/xlsx
    max_zip_entries: int = Field(2000, ge=1)
    max_rows: int = Field(1000, ge=1)
    max_columns: int = Field(200, ge=1)
    max_cell_chars: int = Field(10_000, ge=1)
    max_files: int = Field(20, ge=1)  # per request, for tools that accept several uploads
    max_pdf_pages: int = Field(1000, ge=1)  # across all input files combined
    soffice_path: str | None = None  # None = auto-detect (see docx_to_pdf.converter)
    conversion_timeout_seconds: int = Field(60, ge=1)
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    log_level: str = "INFO"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def max_uncompressed_bytes(self) -> int:
        return self.max_uncompressed_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
