from urllib.parse import quote

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.schemas.mp3 import MP3MetadataResponse
from app.services.id3_service import (
    InvalidMP3FileError,
    extract_metadata,
    update_metadata,
)


router = APIRouter()


def _build_content_disposition(filename: str) -> str:
    safe_ascii_name = "".join(char if ord(char) < 128 else "_" for char in filename)
    encoded_name = quote(filename)
    return f'attachment; filename="{safe_ascii_name}"; filename*=UTF-8\'\'{encoded_name}'


def _normalize_download_filename(filename: str | None, fallback: str) -> str:
    candidate = (filename or "").strip() or fallback
    candidate = "".join("_" if char in '\\/:*?"<>|' else char for char in candidate)
    if not candidate.lower().endswith(".mp3"):
        candidate = f"{candidate}.mp3"
    return candidate


@router.post("/read", response_model=MP3MetadataResponse)
async def read_mp3_metadata(mp3_file: UploadFile = File(...)) -> MP3MetadataResponse:
    if mp3_file.content_type not in {"audio/mpeg", "audio/mp3", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Expected an MP3 file.")

    try:
        file_bytes = await mp3_file.read()
        return extract_metadata(file_bytes=file_bytes, filename=mp3_file.filename or "track.mp3")
    except InvalidMP3FileError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/update")
async def update_mp3_metadata(
    mp3_file: UploadFile = File(...),
    cover_image: UploadFile | None = File(default=None),
    output_filename: str | None = Form(default=None),
    title: str | None = Form(default=None),
    artist: str | None = Form(default=None),
    album: str | None = Form(default=None),
    genre: str | None = Form(default=None),
    year: str | None = Form(default=None),
    track: str | None = Form(default=None),
    comment: str | None = Form(default=None),
) -> StreamingResponse:
    if mp3_file.content_type not in {"audio/mpeg", "audio/mp3", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Expected an MP3 file.")

    cover_bytes = await cover_image.read() if cover_image else None

    try:
        updated_file = await mp3_file.read()
        output_bytes = update_metadata(
            file_bytes=updated_file,
            filename=mp3_file.filename or "track.mp3",
            title=title,
            artist=artist,
            album=album,
            genre=genre,
            year=year,
            track=track,
            comment=comment,
            cover_bytes=cover_bytes,
            cover_mime_type=cover_image.content_type if cover_image else None,
        )
    except InvalidMP3FileError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update MP3 metadata: {exc}",
        ) from exc

    default_name = (mp3_file.filename or "updated-track.mp3").replace(".mp3", "-updated.mp3")
    download_name = _normalize_download_filename(output_filename, default_name)

    return StreamingResponse(
        iter([output_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": _build_content_disposition(download_name)},
    )
