from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class ScriptureChapter(TimestampMixin, Base):
    __tablename__ = "scripture_chapters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_index: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    book: Mapped[str] = mapped_column(String(60), nullable=False)
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reference: Mapped[str] = mapped_column(String(80), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
