from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ScriptureChapterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_index: int
    book: str
    chapter_number: int
    reference: str
    is_completed: bool
    completed_at: datetime | None


class ScriptureCompleteRequest(BaseModel):
    chapter_id: int = Field(..., gt=0)


class ReadingHistoryEntry(BaseModel):
    chapter_id: int
    reference: str
    completed_at: datetime


class HeatmapDay(BaseModel):
    date: date
    count: int
    level: int


class ScriptureProgressRead(BaseModel):
    completed_count: int
    total_count: int
    percent_complete: float
    today_completed: bool
    current_streak: int
    longest_streak: int
    current_reference: str | None
    suggested_next_reference: str | None
    recent_history: list[ReadingHistoryEntry]
    heatmap: list[HeatmapDay]
