from datetime import datetime

from pydantic import BaseModel, Field


class NavidromeAlbumRead(BaseModel):
    id: str
    name: str
    artist: str
    year: int | None = None
    song_count: int | None = None


class NavidromeNowPlayingRead(BaseModel):
    id: str
    title: str
    artist: str
    album: str | None = None
    user: str | None = None
    duration_seconds: int | None = None


class NavidromeLibraryRead(BaseModel):
    artist_count: int | None = None
    album_count: int | None = None
    song_count: int | None = None


class NavidromeWidgetRead(BaseModel):
    enabled: bool
    available: bool
    message: str | None = None
    base_url: str | None = None
    last_synced_at: datetime | None = None
    library: NavidromeLibraryRead = Field(default_factory=NavidromeLibraryRead)
    newest_albums: list[NavidromeAlbumRead] = Field(default_factory=list)
    now_playing: list[NavidromeNowPlayingRead] = Field(default_factory=list)
