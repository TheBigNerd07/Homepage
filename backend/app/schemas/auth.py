from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=1, max_length=200)


class AuthStatusRead(BaseModel):
    enabled: bool
    authenticated: bool
    username: str | None = None
