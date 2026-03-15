from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteBase(BaseModel):
    title: str = Field(default="", max_length=120)
    body: str = Field(default="", max_length=5000)
    is_pinned: bool = False
    is_dashboard_pinned: bool = False
    is_archived: bool = False


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=120)
    body: str | None = Field(default=None, max_length=5000)
    is_pinned: bool | None = None
    is_dashboard_pinned: bool | None = None
    is_archived: bool | None = None


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int
    created_at: datetime
    updated_at: datetime
