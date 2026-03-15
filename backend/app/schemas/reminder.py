from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReminderBase(BaseModel):
    text: str = Field(..., max_length=240)
    notes: str | None = Field(default=None, max_length=500)
    schedule_type: str = Field(default="daily")
    due_date: date | None = None
    due_time: str | None = Field(default=None, min_length=5, max_length=5)

    @model_validator(mode="after")
    def validate_schedule(self) -> "ReminderBase":
        if self.schedule_type not in {"daily", "once"}:
            raise ValueError("Schedule type must be daily or once.")
        if self.schedule_type == "once" and self.due_date is None:
            raise ValueError("One-time reminders require a due date.")
        if self.schedule_type == "daily":
            self.due_date = None
        return self


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    text: str | None = Field(default=None, max_length=240)
    notes: str | None = Field(default=None, max_length=500)
    schedule_type: str | None = None
    due_date: date | None = None
    due_time: str | None = Field(default=None, min_length=5, max_length=5)
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_schedule(self) -> "ReminderUpdate":
        if self.schedule_type is not None and self.schedule_type not in {"daily", "once"}:
            raise ValueError("Schedule type must be daily or once.")
        return self


class ReminderToggleRequest(BaseModel):
    completed: bool
    target_date: date | None = None


class ReminderCompletionRead(BaseModel):
    completed_for_date: date
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    notes: str | None
    schedule_type: str
    due_date: date | None
    due_time: str | None
    sort_order: int
    is_active: bool
    completed: bool
    completed_today: bool
    is_due_today: bool
    is_overdue: bool
    last_completed_at: datetime | None
    completion_history: list[ReminderCompletionRead] = Field(default_factory=list)
