from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utc_now
from app.db.base import Base, TimestampMixin, UTCDateTime


class ReminderSchedule(StrEnum):
    DAILY = "daily"
    ONCE = "once"


class Reminder(TimestampMixin, Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    schedule_type: Mapped[str] = mapped_column(String(16), default=ReminderSchedule.DAILY.value)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    completions: Mapped[list["ReminderCompletion"]] = relationship(
        back_populates="reminder",
        cascade="all, delete-orphan",
        order_by="ReminderCompletion.completed_at.desc()",
    )


class ReminderCompletion(Base):
    __tablename__ = "reminder_completions"
    __table_args__ = (
        UniqueConstraint(
            "reminder_id",
            "completed_for_date",
            name="uq_reminder_completed_for_date",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reminder_id: Mapped[int] = mapped_column(ForeignKey("reminders.id", ondelete="CASCADE"), nullable=False)
    completed_for_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)

    reminder: Mapped[Reminder] = relationship(back_populates="completions")
