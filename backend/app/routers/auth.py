from fastapi import APIRouter, HTTPException, Request, Response, status

from app.core.auth import clear_session_cookie, get_optional_session, set_session_cookie, verify_admin_password
from app.core.config import get_settings
from app.schemas.auth import AuthStatusRead, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status", response_model=AuthStatusRead)
def auth_status(request: Request) -> AuthStatusRead:
    settings = get_settings()
    if not settings.auth_enabled:
        return AuthStatusRead(enabled=False, authenticated=True)

    session = get_optional_session(request)
    return AuthStatusRead(
        enabled=True,
        authenticated=session is not None,
        username=session.username if session else None,
    )


@router.post("/login", response_model=AuthStatusRead)
def login(payload: LoginRequest, response: Response) -> AuthStatusRead:
    settings = get_settings()
    if not settings.auth_enabled:
        return AuthStatusRead(enabled=False, authenticated=True)
    if payload.username != settings.auth_admin_username or not verify_admin_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    set_session_cookie(response, settings.auth_admin_username)
    return AuthStatusRead(enabled=True, authenticated=True, username=settings.auth_admin_username)


@router.post("/logout", response_model=AuthStatusRead)
def logout(response: Response) -> AuthStatusRead:
    settings = get_settings()
    clear_session_cookie(response)
    return AuthStatusRead(enabled=settings.auth_enabled, authenticated=not settings.auth_enabled)
