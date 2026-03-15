from datetime import datetime

from pydantic import BaseModel, Field


class ControlItemRead(BaseModel):
    id: str
    title: str
    description: str
    category: str
    kind: str
    icon: str
    url: str | None = None
    action_key: str | None = None
    command_key: str | None = None
    open_in_new_tab: bool = False
    requires_confirmation: bool = False
    confirmation_message: str | None = None
    is_favorite: bool = False


class HistoryEntryRead(BaseModel):
    id: int
    entry_type: str
    action_key: str
    title: str
    category: str
    status: str
    output: str
    duration_ms: int | None = None
    created_at: datetime


class LogSourceRead(BaseModel):
    id: str
    label: str
    description: str
    available: bool


class LogRead(BaseModel):
    source: str
    fetched_at: datetime
    lines: list[str] = Field(default_factory=list)


class CommandRunResult(BaseModel):
    command_key: str
    title: str
    ok: bool
    status: str
    output: str
    duration_ms: int
    created_at: datetime


class ControlCenterSummaryRead(BaseModel):
    actions: list[ControlItemRead] = Field(default_factory=list)
    commands: list[ControlItemRead] = Field(default_factory=list)
    recent_history: list[HistoryEntryRead] = Field(default_factory=list)
    log_sources: list[LogSourceRead] = Field(default_factory=list)
