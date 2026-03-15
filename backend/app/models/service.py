from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class ServiceStatus(StrEnum):
    ONLINE = "online"
    DEGRADED = "degraded"
    OFFLINE = "offline"
    UNKNOWN = "unknown"


class ServiceLink(TimestampMixin, Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    icon: Mapped[str] = mapped_column(String(40), default="Server")
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(60), default="Media")
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    open_in_new_tab: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(20), default=ServiceStatus.UNKNOWN.value)
    manual_status: Mapped[str] = mapped_column(String(20), default=ServiceStatus.UNKNOWN.value)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    health_check_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    health_check_interval_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    health_check_timeout_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status_reason: Mapped[str] = mapped_column(Text, default="")

    checks: Mapped[list["ServiceStatusCheck"]] = relationship(
        back_populates="service",
        cascade="all, delete-orphan",
        order_by="ServiceStatusCheck.checked_at.desc()",
    )

    @property
    def has_health_check(self) -> bool:
        return bool(self.health_check_url)
