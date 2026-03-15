from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.dashboard_defaults import (
    clone_dashboard_sections,
    clone_widget_layout,
    default_favorite_command_keys,
    default_favorite_widget_ids,
    default_service_categories,
)


class DashboardSectionPreference(BaseModel):
    id: str = Field(..., min_length=1, max_length=40)
    label: str = Field(..., min_length=1, max_length=60)
    description: str = Field(default="", max_length=160)
    enabled: bool = True

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "-")

    @field_validator("label", "description")
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip()


class WidgetLayoutPreference(BaseModel):
    widget_id: str = Field(..., min_length=1, max_length=60)
    section_id: str = Field(..., min_length=1, max_length=40)
    order: int = Field(default=1, ge=1, le=100)
    size: str = Field(default="half", max_length=20)
    enabled: bool = True

    @field_validator("widget_id", "section_id")
    @classmethod
    def normalize_ids(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "_")

    @field_validator("size")
    @classmethod
    def validate_size(cls, value: str) -> str:
        if value not in {"compact", "half", "wide", "hero"}:
            raise ValueError("Widget size must be compact, half, wide, or hero.")
        return value


class SettingBase(BaseModel):
    dashboard_title: str = Field(default="PiOne Command Center", max_length=120)
    display_name: str = Field(default="Friend", max_length=80)
    accent_color: str = Field(default="#5EEAD4", min_length=7, max_length=7)
    morning_intro: str = Field(default="Here is your dashboard for today.", max_length=240)
    afternoon_intro: str = Field(default="Here is what still matters today.", max_length=240)
    evening_intro: str = Field(default="You still have a few things left today.", max_length=240)
    focus_message: str = Field(default="Small, steady progress is enough for today.", max_length=240)
    default_reminder_time: str = Field(default="08:00", min_length=5, max_length=5)
    show_quotes: bool = True
    density_mode: str = Field(default="comfortable", max_length=20)
    service_categories: list[str] = Field(default_factory=default_service_categories)
    default_status_check_interval_seconds: int = Field(default=90, ge=30, le=3600)
    default_status_check_timeout_seconds: int = Field(default=3, ge=1, le=30)
    background_style: str = Field(default="gradient", max_length=20)
    mobile_home_mode: str = Field(default="briefing", max_length=20)
    service_grouping: str = Field(default="category", max_length=20)
    today_focus: str = Field(default="", max_length=240)
    show_scripture_of_the_day: bool = True
    show_motivational_message: bool = True
    dashboard_sections: list[DashboardSectionPreference] = Field(default_factory=clone_dashboard_sections)
    widget_layout: list[WidgetLayoutPreference] = Field(default_factory=clone_widget_layout)
    favorite_widget_ids: list[str] = Field(default_factory=default_favorite_widget_ids)
    favorite_command_keys: list[str] = Field(default_factory=default_favorite_command_keys)

    @field_validator("dashboard_title", "display_name", "morning_intro", "afternoon_intro", "evening_intro", "focus_message", "today_focus")
    @classmethod
    def trim_string_values(cls, value: str) -> str:
        return value.strip()

    @field_validator("accent_color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        if len(value) != 7 or not value.startswith("#"):
            raise ValueError("Accent color must use #RRGGBB format.")
        return value.upper()

    @field_validator("default_reminder_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        hours, minutes = value.split(":")
        if not (0 <= int(hours) <= 23 and 0 <= int(minutes) <= 59):
            raise ValueError("Time must use HH:MM format.")
        return value

    @field_validator("density_mode")
    @classmethod
    def validate_density_mode(cls, value: str) -> str:
        if value not in {"comfortable", "compact"}:
            raise ValueError("Density mode must be comfortable or compact.")
        return value

    @field_validator("background_style")
    @classmethod
    def validate_background_style(cls, value: str) -> str:
        if value not in {"none", "gradient", "pattern"}:
            raise ValueError("Background style must be none, gradient, or pattern.")
        return value

    @field_validator("mobile_home_mode")
    @classmethod
    def validate_mobile_mode(cls, value: str) -> str:
        if value not in {"full", "briefing", "compact"}:
            raise ValueError("Mobile mode must be full, briefing, or compact.")
        return value

    @field_validator("service_grouping")
    @classmethod
    def validate_service_grouping(cls, value: str) -> str:
        if value not in {"category", "node", "favorites"}:
            raise ValueError("Service grouping must be category, node, or favorites.")
        return value

    @field_validator("service_categories")
    @classmethod
    def validate_service_categories(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            item = value.strip()
            normalized = item.casefold()
            if not item or normalized in seen:
                continue
            if len(item) > 60:
                raise ValueError("Service categories must be 60 characters or fewer.")
            seen.add(normalized)
            cleaned.append(item)
        return cleaned or ["General"]

    @field_validator("favorite_widget_ids", "favorite_command_keys")
    @classmethod
    def validate_favorites(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            item = value.strip().lower().replace(" ", "_")
            if item and item not in seen:
                seen.add(item)
                cleaned.append(item)
        return cleaned

    @field_validator("dashboard_sections")
    @classmethod
    def validate_sections(cls, sections: list[DashboardSectionPreference]) -> list[DashboardSectionPreference]:
        deduped: list[DashboardSectionPreference] = []
        seen: set[str] = set()
        for section in sections:
            if section.id in seen:
                continue
            seen.add(section.id)
            deduped.append(section)
        return deduped or [DashboardSectionPreference.model_validate(section) for section in clone_dashboard_sections()]

    @field_validator("widget_layout")
    @classmethod
    def validate_widget_layout(cls, layout: list[WidgetLayoutPreference]) -> list[WidgetLayoutPreference]:
        deduped: dict[str, WidgetLayoutPreference] = {}
        for item in layout:
            deduped[item.widget_id] = item
        items = list(deduped.values())
        items.sort(key=lambda entry: (entry.section_id, entry.order, entry.widget_id))
        if items:
            return items
        return [WidgetLayoutPreference.model_validate(item) for item in clone_widget_layout()]

    @model_validator(mode="after")
    def align_layout_to_sections(self) -> "SettingBase":
        section_ids = {section.id for section in self.dashboard_sections}
        for item in self.widget_layout:
            if item.section_id not in section_ids:
                item.section_id = self.dashboard_sections[0].id
        return self


class SettingUpdate(SettingBase):
    pass


class SettingRead(SettingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
