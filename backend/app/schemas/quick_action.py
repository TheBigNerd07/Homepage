from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


class QuickActionLinkBase(BaseModel):
    name: str = Field(..., max_length=120)
    icon: str = Field(default="ExternalLink", max_length=40)
    description: str = Field(default="", max_length=240)
    url: str
    open_in_new_tab: bool = True
    is_enabled: bool = True

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must include an http or https scheme.")
        return value


class QuickActionLinkCreate(QuickActionLinkBase):
    pass


class QuickActionLinkUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    icon: str | None = Field(default=None, max_length=40)
    description: str | None = Field(default=None, max_length=240)
    url: str | None = None
    open_in_new_tab: bool | None = None
    is_enabled: bool | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must include an http or https scheme.")
        return value


class QuickActionLinkRead(QuickActionLinkBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sort_order: int


class DashboardActionRead(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    kind: str
    url: str | None = None
    action_key: str | None = None
    open_in_new_tab: bool = False
    requires_confirmation: bool = False
    confirmation_message: str | None = None


class QuickActionReorderRequest(BaseModel):
    ordered_ids: list[int] = Field(default_factory=list, min_length=1)
