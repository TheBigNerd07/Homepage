from pydantic import BaseModel


class HealthRead(BaseModel):
    status: str
    database: str
    timestamp: str


class ActionResultRead(BaseModel):
    ok: bool
    message: str
    checked: int | None = None
