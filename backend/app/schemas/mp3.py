from pydantic import BaseModel, Field


class MP3Metadata(BaseModel):
    filename: str
    title: str | None = None
    artist: str | None = None
    album: str | None = None
    genre: str | None = None
    year: str | None = None
    track: str | None = None
    comment: str | None = None
    has_cover: bool = False
    cover_mime_type: str | None = None
    cover_data_url: str | None = None


class MP3MetadataResponse(BaseModel):
    metadata: MP3Metadata
    warnings: list[str] = Field(default_factory=list)
