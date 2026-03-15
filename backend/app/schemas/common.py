from pydantic import BaseModel


class HealthRead(BaseModel):
    status: str
    database: str
    timestamp: str


class ChartPoint(BaseModel):
    label: str
    value: float | None = None
    timestamp: str | None = None


class ActionResultRead(BaseModel):
    ok: bool
    message: str
    checked: int | None = None
