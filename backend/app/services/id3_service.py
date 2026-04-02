from pathlib import Path
import base64
import os
import tempfile
from io import BytesIO

from mutagen.id3 import APIC, COMM, ID3, ID3NoHeaderError, TALB, TCON, TDRC, TIT2, TPE1, TRCK, TYER
from mutagen.mp3 import MP3, HeaderNotFoundError
from PIL import Image

from app.schemas.mp3 import MP3Metadata, MP3MetadataResponse


class InvalidMP3FileError(Exception):
    pass


def _load_tags(file_bytes: bytes) -> ID3:
    try:
        return ID3(fileobj=BytesIO(file_bytes))
    except ID3NoHeaderError:
        return ID3()
    except HeaderNotFoundError as exc:
        raise InvalidMP3FileError("The uploaded file is not a valid MP3.") from exc


def _validate_mp3(file_bytes: bytes) -> None:
    try:
        MP3(BytesIO(file_bytes))
    except HeaderNotFoundError as exc:
        raise InvalidMP3FileError("The uploaded file is not a valid MP3.") from exc


def _frame_text(tags: ID3, frame_id: str) -> str | None:
    frame = tags.get(frame_id)
    if frame is None:
        return None

    if hasattr(frame, "text") and frame.text:
        return str(frame.text[0]).strip() or None

    return None


def _first_frame_text(tags: ID3, frame_ids: list[str]) -> str | None:
    for frame_id in frame_ids:
        value = _frame_text(tags, frame_id)
        if value:
            return value

    return None


def _comment_text(tags: ID3) -> str | None:
    comments = tags.getall("COMM")
    if not comments:
        return None

    comment = comments[0]
    if getattr(comment, "text", None):
        return str(comment.text[0]).strip() or None

    return None


def _normalize_cover_image(cover_bytes: bytes | None) -> tuple[bytes | None, str | None]:
    if not cover_bytes:
        return None, None

    with Image.open(BytesIO(cover_bytes)) as image:
        image = image.convert("RGB")
        source_width, source_height = image.size
        target_size = 500
        crop_size = min(source_width, source_height)
        left = (source_width - crop_size) // 2
        top = (source_height - crop_size) // 2
        right = left + crop_size
        bottom = top + crop_size

        cropped = image.crop((left, top, right, bottom))
        canvas = cropped.resize((target_size, target_size), Image.Resampling.LANCZOS)

        output = BytesIO()
        canvas.save(output, format="JPEG", quality=82, optimize=True)
        return output.getvalue(), "image/jpeg"


def extract_metadata(file_bytes: bytes, filename: str) -> MP3MetadataResponse:
    _validate_mp3(file_bytes)
    tags = _load_tags(file_bytes)
    cover = tags.getall("APIC")

    metadata = MP3Metadata(
        filename=filename,
        title=_frame_text(tags, "TIT2"),
        artist=_frame_text(tags, "TPE1"),
        album=_frame_text(tags, "TALB"),
        genre=_frame_text(tags, "TCON"),
        year=_first_frame_text(tags, ["TDRC", "TYER"]),
        track=_frame_text(tags, "TRCK"),
        comment=_comment_text(tags),
        has_cover=bool(cover),
        cover_mime_type=cover[0].mime if cover else None,
        cover_data_url=(
            f"data:{cover[0].mime};base64,{base64.b64encode(cover[0].data).decode('ascii')}"
            if cover
            else None
        ),
    )

    warnings: list[str] = []
    if not metadata.has_cover:
        warnings.append("Cover art is missing.")

    return MP3MetadataResponse(metadata=metadata, warnings=warnings)


def _set_text_frame(tags: ID3, frame_id: str, frame_cls, value: str | None) -> None:
    if value is None:
        return

    normalized = value.strip()
    tags.delall(frame_id)
    if normalized:
        tags.add(frame_cls(encoding=1, text=normalized))


def _normalize_title(filename: str, title: str | None) -> str:
    normalized = (title or "").strip()
    if normalized:
        return normalized

    return Path(filename).stem.strip() or "Untitled Track"


def update_metadata(
    file_bytes: bytes,
    filename: str,
    title: str | None,
    artist: str | None,
    album: str | None,
    genre: str | None,
    year: str | None,
    track: str | None,
    comment: str | None,
    cover_bytes: bytes | None,
    cover_mime_type: str | None,
    remove_cover: bool = False,
) -> bytes:
    _validate_mp3(file_bytes)
    tags = _load_tags(file_bytes)
    normalized_cover_bytes, normalized_cover_mime_type = _normalize_cover_image(cover_bytes)
    safe_title = _normalize_title(filename, title)

    _set_text_frame(tags, "TIT2", TIT2, safe_title)
    _set_text_frame(tags, "TPE1", TPE1, artist)
    _set_text_frame(tags, "TALB", TALB, album)
    _set_text_frame(tags, "TCON", TCON, genre)
    _set_text_frame(tags, "TYER", TYER, year)
    _set_text_frame(tags, "TDRC", TDRC, year)
    _set_text_frame(tags, "TRCK", TRCK, track)

    if comment is not None:
        tags.delall("COMM")
        normalized_comment = comment.strip()
        if normalized_comment:
            tags.add(COMM(encoding=1, lang="eng", desc="", text=normalized_comment))

    if remove_cover:
        tags.delall("APIC")
    elif normalized_cover_bytes:
        tags.delall("APIC")
        tags.add(
            APIC(
                encoding=1,
                mime=normalized_cover_mime_type or "image/jpeg",
                type=3,
                desc="Cover",
                data=normalized_cover_bytes,
            )
        )

    temp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        tags.save(temp_path, v2_version=3)

        with open(temp_path, "rb") as updated_file:
            return updated_file.read()
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
