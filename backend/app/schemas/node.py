from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import ChartPoint


class NodeStatusCheckRead(BaseModel):
    id: int
    node_id: int
    status: str
    checked_at: datetime
    response_time_ms: int | None = None
    http_status: int | None = None
    message: str | None = None


class NodeBase(BaseModel):
    name: str = Field(..., max_length=120)
    hostname: str = Field(..., max_length=255)
    role: str = Field(default="General", max_length=80)
    description: str = Field(default="", max_length=240)
    status_endpoint: str | None = Field(default=None, max_length=255)
    metrics_source: str | None = Field(default=None, max_length=255)
    tags: list[str] = Field(default_factory=list)
    is_enabled: bool = True
    is_local: bool = False

    @field_validator("name", "hostname", "role", "description", "status_endpoint", "metrics_source")
    @classmethod
    def trim_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            item = value.strip()
            normalized = item.casefold()
            if not item or normalized in seen:
                continue
            if len(item) > 40:
                raise ValueError("Tags must be 40 characters or fewer.")
            seen.add(normalized)
            cleaned.append(item)
        return cleaned


class NodeCreate(NodeBase):
    pass


class NodeUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    hostname: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=240)
    status_endpoint: str | None = Field(default=None, max_length=255)
    metrics_source: str | None = Field(default=None, max_length=255)
    tags: list[str] | None = None
    is_enabled: bool | None = None
    is_local: bool | None = None


class NodeSummaryRead(NodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int
    status: str
    status_reason: str | None = None
    service_count: int = 0
    online_service_count: int = 0
    degraded_service_count: int = 0
    offline_service_count: int = 0
    unknown_service_count: int = 0
    last_checked_at: datetime | None = None
    last_response_time_ms: int | None = None
    last_http_status: int | None = None
    last_metric_at: datetime | None = None
    cpu_usage_percent: float | None = None
    memory_used_percent: float | None = None
    disk_used_percent: float | None = None
    status_history: list[NodeStatusCheckRead] = Field(default_factory=list)
    cpu_trend: list[ChartPoint] = Field(default_factory=list)
    memory_trend: list[ChartPoint] = Field(default_factory=list)
