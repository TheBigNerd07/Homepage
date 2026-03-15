from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.dashboard_defaults import (
    clone_dashboard_sections,
    clone_widget_layout,
    default_favorite_command_keys,
    default_favorite_widget_ids,
    default_service_categories,
)
from app.db.base import Base, TimestampMixin


class AppSetting(TimestampMixin, Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    dashboard_title: Mapped[str] = mapped_column(String(120), default="PiOne Command Center")
    display_name: Mapped[str] = mapped_column(String(80), default="Friend")
    accent_color: Mapped[str] = mapped_column(String(7), default="#5EEAD4")
    morning_intro: Mapped[str] = mapped_column(
        Text,
        default="Here is your dashboard for today.",
    )
    afternoon_intro: Mapped[str] = mapped_column(
        Text,
        default="Here is what still matters today.",
    )
    evening_intro: Mapped[str] = mapped_column(
        Text,
        default="You still have a few things left today.",
    )
    focus_message: Mapped[str] = mapped_column(
        Text,
        default="Small, steady progress is enough for today.",
    )
    default_reminder_time: Mapped[str] = mapped_column(String(5), default="08:00")
    show_quotes: Mapped[bool] = mapped_column(Boolean, default=True)
    density_mode: Mapped[str] = mapped_column(String(20), default="comfortable")
    service_categories: Mapped[list[str]] = mapped_column(JSON, default=default_service_categories)
    default_status_check_interval_seconds: Mapped[int] = mapped_column(Integer, default=90)
    default_status_check_timeout_seconds: Mapped[int] = mapped_column(Integer, default=3)
    background_style: Mapped[str] = mapped_column(String(20), default="gradient")
    mobile_home_mode: Mapped[str] = mapped_column(String(20), default="briefing")
    service_grouping: Mapped[str] = mapped_column(String(20), default="category")
    today_focus: Mapped[str] = mapped_column(Text, default="")
    show_scripture_of_the_day: Mapped[bool] = mapped_column(Boolean, default=True)
    show_motivational_message: Mapped[bool] = mapped_column(Boolean, default=True)
    dashboard_sections: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=clone_dashboard_sections)
    widget_layout: Mapped[list[dict[str, object]]] = mapped_column(JSON, default=clone_widget_layout)
    favorite_widget_ids: Mapped[list[str]] = mapped_column(JSON, default=default_favorite_widget_ids)
    favorite_command_keys: Mapped[list[str]] = mapped_column(JSON, default=default_favorite_command_keys)
