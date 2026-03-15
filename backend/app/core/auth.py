import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass
from datetime import timedelta

from fastapi import HTTPException, Request, Response, status

from app.core.config import get_settings
from app.core.time import utc_now

AUTH_COOKIE_NAME = "pione_session"
PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 390000


@dataclass(slots=True)
class AuthSession:
    username: str
    expires_at: int


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def hash_password(password: str, *, iterations: int = PBKDF2_ITERATIONS) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"{PBKDF2_ALGORITHM}${iterations}${salt}${_encode(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, raw_iterations, salt, expected = encoded.split("$", 3)
    except ValueError:
        return False
    if algorithm != PBKDF2_ALGORITHM:
        return False
    try:
        iterations = int(raw_iterations)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return hmac.compare_digest(_encode(digest), expected)


def verify_admin_password(password: str) -> bool:
    settings = get_settings()
    if settings.auth_password_hash:
        return verify_password(password, settings.auth_password_hash)
    if settings.auth_password is None:
        return False
    return hmac.compare_digest(password, settings.auth_password)


def _sign(value: str) -> str:
    secret = get_settings().auth_secret_key.encode("utf-8")
    signature = hmac.new(secret, value.encode("utf-8"), hashlib.sha256).digest()
    return _encode(signature)


def create_session_token(username: str) -> tuple[str, int]:
    settings = get_settings()
    expires_at = int((utc_now() + timedelta(hours=settings.auth_session_ttl_hours)).timestamp())
    payload = _encode(
        json.dumps(
            {"sub": username, "exp": expires_at},
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
    )
    return f"{payload}.{_sign(payload)}", expires_at


def read_session_token(token: str | None) -> AuthSession | None:
    if not token or "." not in token:
        return None
    payload, signature = token.split(".", 1)
    if not hmac.compare_digest(signature, _sign(payload)):
        return None
    try:
        data = json.loads(_decode(payload).decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return None
    username = data.get("sub")
    expires_at = data.get("exp")
    if not isinstance(username, str) or not isinstance(expires_at, int):
        return None
    if expires_at <= int(utc_now().timestamp()):
        return None
    return AuthSession(username=username, expires_at=expires_at)


def set_session_cookie(response: Response, username: str) -> None:
    settings = get_settings()
    token, expires_at = create_session_token(username)
    max_age = max(expires_at - int(utc_now().timestamp()), 0)
    response.set_cookie(
        AUTH_COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        secure=settings.resolved_session_cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(AUTH_COOKIE_NAME, path="/")


def get_optional_session(request: Request) -> AuthSession | None:
    settings = get_settings()
    if not settings.auth_enabled:
        return AuthSession(username=settings.auth_admin_username, expires_at=0)
    return read_session_token(request.cookies.get(AUTH_COOKIE_NAME))


def require_authenticated_request(request: Request) -> AuthSession | None:
    settings = get_settings()
    if not settings.auth_enabled:
        return None
    session = get_optional_session(request)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return session
