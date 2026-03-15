from datetime import datetime
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_status(value: str) -> str:
    mapping = {
        "healthy": "online",
        "attention": "degraded",
        "online": "online",
        "degraded": "degraded",
        "offline": "offline",
        "unknown": "unknown",
    }
    normalized = mapping.get(value.lower())
    if normalized is None:
        raise ValueError("Status must be online, degraded, offline, or unknown.")
    return normalized


class ServiceBase(BaseModel):
    name: str = Field(..., max_length=120)
    icon: str = Field(default="Server", max_length=40)
    description: str = Field(default="", max_length=240)
    category: str = Field(default="General", max_length=60)
    url: str
    open_in_new_tab: bool = True
    manual_status: str = "unknown"
    tags: list[str] = Field(default_factory=list)
    is_enabled: bool = True
    is_favorite: bool = False
    health_check_url: str | None = None
    health_check_interval_seconds: int | None = Field(default=None, ge=30, le=3600)
    health_check_timeout_seconds: int | None = Field(default=None, ge=1, le=30)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must include an http or https scheme.")
        return value

    @field_validator("health_check_url")
    @classmethod
    def validate_health_check_url(cls, value: str | None) -> str | None:
        if value in {None, ""}:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Health check URL must include an http or https scheme.")
        return value

    @field_validator("manual_status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        return _normalize_status(value)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    icon: str | None = Field(default=None, max_length=40)
    description: str | None = Field(default=None, max_length=240)
    category: str | None = Field(default=None, max_length=60)
    url: str | None = None
    open_in_new_tab: bool | None = None
    manual_status: str | None = None
    tags: list[str] | None = None
    is_enabled: bool | None = None
    is_favorite: bool | None = None
    health_check_url: str | None = None
    health_check_interval_seconds: int | None = Field(default=None, ge=30, le=3600)
    health_check_timeout_seconds: int | None = Field(default=None, ge=1, le=30)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must include an http or https scheme.")
        return value

    @field_validator("health_check_url")
    @classmethod
    def validate_health_check_url(cls, value: str | None) -> str | None:
        if value in {None, ""}:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Health check URL must include an http or https scheme.")
        return value

    @field_validator("manual_status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _normalize_status(value)


class ServiceRead(ServiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sort_order: int
    status: str
    last_checked_at: datetime | None = None
    last_response_time_ms: int | None = None
    last_http_status: int | None = None
    status_reason: str | None = None
    has_health_check: bool


class ServiceStatusCheckRead(BaseModel):
    id: int
    service_id: int
    service_name: str
    status: str
    checked_at: datetime
    response_time_ms: int | None = None
    http_status: int | None = None
    message: str | None = None


class ServiceReorderRequest(BaseModel):
    ordered_ids: list[int] = Field(default_factory=list, min_length=1)
