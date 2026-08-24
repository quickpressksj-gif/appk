"""Media upload models — Cloudinary backed (Sprint: Production Integration)."""

from __future__ import annotations

from pydantic import BaseModel, field_validator


class ImageUploadPayload(BaseModel):
    """A data URL (`data:image/png;base64,...`) or an https image URL."""

    image: str

    @field_validator("image")
    @classmethod
    def _image(cls, value: str) -> str:
        cleaned = (value or "").strip()
        if not cleaned:
            raise ValueError("An image is required")
        if not (cleaned.startswith("data:image/") or cleaned.startswith("http")):
            raise ValueError("Image must be a data URL or an https URL")
        if len(cleaned) > 25_000_000:
            raise ValueError("Image is too large (max ~20 MB)")
        return cleaned


class MediaResponse(BaseModel):
    """Only the Cloudinary secure URL is returned and stored."""

    url: str
    field: str
