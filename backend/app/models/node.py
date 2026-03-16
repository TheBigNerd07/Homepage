from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UTCDateTime


class LabNode(TimestampMixin, Base):
    __tablename__ = "nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(80), default="General")
    description: Mapped[str] = mapped_column(Text, default="")
    status_endpoint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    metrics_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_local: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="unknown")
    last_checked_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    last_response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status_reason: Mapped[str] = mapped_column(Text, default="")

    services: Mapped[list["ServiceLink"]] = relationship(back_populates="node")
    checks: Mapped[list["NodeStatusCheck"]] = relationship(
        back_populates="node",
        cascade="all, delete-orphan",
        order_by="NodeStatusCheck.checked_at.desc()",
    )
    metric_samples: Mapped[list["MetricSample"]] = relationship(
        back_populates="node",
        cascade="all, delete-orphan",
        order_by="MetricSample.recorded_at.desc()",
    )


class NodeStatusCheck(Base):
    __tablename__ = "node_status_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    checked_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(Text, default="")

    node: Mapped[LabNode] = relationship(back_populates="checks")
