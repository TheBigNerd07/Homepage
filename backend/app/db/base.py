from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.time import to_utc, utc_now


class Base(DeclarativeBase):
    """Base declarative class."""


class UTCDateTime(TypeDecorator[datetime]):
    impl = DateTime
    cache_ok = True

    def __init__(self) -> None:
        super().__init__(timezone=True)

    def process_bind_param(self, value: datetime | None, _dialect):
        if value is None:
            return None
        return to_utc(value)

    def process_result_value(self, value: datetime | None, _dialect):
        if value is None:
            return None
        return to_utc(value)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime(),
        default=utc_now,
        onupdate=utc_now,
    )
