from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MetricSample(Base):
    __tablename__ = "metric_samples"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    node_id: Mapped[int | None] = mapped_column(ForeignKey("nodes.id", ondelete="SET NULL"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cpu_usage_percent: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    memory_used_percent: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    disk_used_percent: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    online_service_count: Mapped[int] = mapped_column(Integer, default=0)
    degraded_service_count: Mapped[int] = mapped_column(Integer, default=0)
    offline_service_count: Mapped[int] = mapped_column(Integer, default=0)
    reminder_open_count: Mapped[int] = mapped_column(Integer, default=0)
    reading_percent_complete: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    reading_streak: Mapped[int] = mapped_column(Integer, default=0)

    node: Mapped["LabNode | None"] = relationship(back_populates="metric_samples")
