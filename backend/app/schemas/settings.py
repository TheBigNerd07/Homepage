from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    service_categories: list[str] = Field(default_factory=lambda: ["Operations", "Media", "Observability", "Study", "General"])
    default_status_check_interval_seconds: int = Field(default=90, ge=30, le=3600)
    default_status_check_timeout_seconds: int = Field(default=3, ge=1, le=30)

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

    @field_validator("service_categories")
    @classmethod
    def validate_service_categories(cls, values: list[str]) -> list[str]:
        cleaned = []
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


class SettingUpdate(SettingBase):
    pass


class SettingRead(SettingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
