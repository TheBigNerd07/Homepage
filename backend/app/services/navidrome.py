import hashlib
import json
import secrets
from dataclasses import dataclass
from threading import Lock
from time import monotonic
from urllib.parse import urlencode
from urllib.request import urlopen

from app.core.config import get_settings
from app.core.time import utc_now
from app.schemas.navidrome import (
    NavidromeAlbumRead,
    NavidromeLibraryRead,
    NavidromeNowPlayingRead,
    NavidromeWidgetRead,
)


@dataclass(slots=True)
class _NavidromeCacheEntry:
    fetched_at_monotonic: float
    value: NavidromeWidgetRead


_CACHE_LOCK = Lock()
_CACHE_TTL_SECONDS = 120
_CACHE: _NavidromeCacheEntry | None = None


def _as_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _subsonic_request(endpoint: str, params: dict[str, str | int]) -> dict:
    settings = get_settings()
    salt = secrets.token_hex(4)
    token = hashlib.md5(f"{settings.navidrome_password}{salt}".encode("utf-8")).hexdigest()
    query = {
        "u": settings.navidrome_username or "",
        "t": token,
        "s": salt,
        "v": "1.16.1",
        "c": "pione-homepage",
        "f": "json",
        **params,
    }
    url = f"{settings.navidrome_base_url.rstrip('/')}/rest/{endpoint}.view?{urlencode(query)}"
    with urlopen(url, timeout=settings.navidrome_timeout_seconds) as response:
        payload = json.loads(response.read().decode("utf-8"))
    root = payload.get("subsonic-response", {})
    if root.get("status") != "ok":
        error = root.get("error", {})
        message = error.get("message") or "Navidrome returned an error."
        raise RuntimeError(message)
    return root


def _build_widget() -> NavidromeWidgetRead:
    settings = get_settings()
    if not settings.navidrome_configured:
        if settings.navidrome_partially_configured:
            return NavidromeWidgetRead(
                enabled=True,
                available=False,
                message="Navidrome settings are incomplete. Set base URL, username, and password.",
                base_url=settings.navidrome_base_url,
            )
        return NavidromeWidgetRead(
            enabled=False,
            available=False,
            message="Navidrome integration is disabled.",
        )

    newest = _subsonic_request("getAlbumList2", {"type": "newest", "size": 6})
    now_playing = _subsonic_request("getNowPlaying", {})
    artists = _subsonic_request("getArtists", {})

    artist_rows = []
    for group in _as_list(artists.get("artists", {}).get("index")):
        artist_rows.extend(_as_list(group.get("artist")))

    album_count = 0
    for row in artist_rows:
        try:
            album_count += int(row.get("albumCount", 0))
        except (TypeError, ValueError):
            continue

    return NavidromeWidgetRead(
        enabled=True,
        available=True,
        message="Connected to Navidrome.",
        base_url=settings.navidrome_base_url,
        last_synced_at=utc_now(),
        library=NavidromeLibraryRead(
            artist_count=len(artist_rows) or None,
            album_count=album_count or None,
            song_count=None,
        ),
        newest_albums=[
            NavidromeAlbumRead(
                id=str(album.get("id", "")),
                name=str(album.get("name", "Unknown Album")),
                artist=str(album.get("artist", "Unknown Artist")),
                year=int(album["year"]) if str(album.get("year", "")).isdigit() else None,
                song_count=int(album["songCount"]) if str(album.get("songCount", "")).isdigit() else None,
            )
            for album in _as_list(newest.get("albumList2", {}).get("album"))
        ],
        now_playing=[
            NavidromeNowPlayingRead(
                id=str(entry.get("id", "")),
                title=str(entry.get("title", "Unknown Track")),
                artist=str(entry.get("artist", "Unknown Artist")),
                album=str(entry.get("album")) if entry.get("album") else None,
                user=str(entry.get("username")) if entry.get("username") else None,
                duration_seconds=int(entry["duration"]) if str(entry.get("duration", "")).isdigit() else None,
            )
            for entry in _as_list(now_playing.get("nowPlaying", {}).get("entry"))
        ],
    )


def get_navidrome_widget(*, force: bool = False) -> NavidromeWidgetRead:
    global _CACHE

    settings = get_settings()
    if not settings.navidrome_configured and not settings.navidrome_partially_configured:
        return NavidromeWidgetRead(enabled=False, available=False, message="Navidrome integration is disabled.")

    with _CACHE_LOCK:
        if not force and _CACHE is not None and monotonic() - _CACHE.fetched_at_monotonic < _CACHE_TTL_SECONDS:
            return _CACHE.value

    try:
        widget = _build_widget()
    except Exception as exc:
        with _CACHE_LOCK:
            if _CACHE is not None:
                return _CACHE.value.model_copy(
                    update={
                        "available": False,
                        "message": f"Using cached Navidrome data: {exc}",
                    }
                )
        return NavidromeWidgetRead(
            enabled=True,
            available=False,
            message=f"Navidrome unavailable: {exc}",
            base_url=settings.navidrome_base_url,
        )

    with _CACHE_LOCK:
        _CACHE = _NavidromeCacheEntry(fetched_at_monotonic=monotonic(), value=widget)
    return widget
