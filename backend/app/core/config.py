from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PiOne Command Center"
    app_version: str = "2.0.0"
    environment: str = "production"
    api_prefix: str = "/api"
    database_path: str = "/data/pione-homepage.db"
    backup_dir: str | None = "/backups"
    app_timezone: str = "America/Los_Angeles"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    lab_hostname: str = "PiOne"
    public_base_url: str | None = None
    trusted_hosts: str = "*"
    behind_proxy: bool = True
    session_cookie_secure: bool | None = None

    auth_enabled: bool = False
    auth_admin_username: str = "admin"
    auth_password: str | None = None
    auth_password_hash: str | None = None
    auth_secret_key: str = "change-this-secret-key"
    auth_session_ttl_hours: int = 24 * 14

    navidrome_base_url: str | None = None
    navidrome_username: str | None = None
    navidrome_password: str | None = None
    navidrome_timeout_seconds: int = 4

    docker_socket_path: str = "/var/run/docker.sock"
    app_container_name: str | None = None
    service_monitor_tick_seconds: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.database_path}"

    @property
    def database_file(self) -> Path:
        return Path(self.database_path)

    @property
    def backup_dir_path(self) -> Path | None:
        if not self.backup_dir:
            return None
        return Path(self.backup_dir)

    @property
    def public_origin(self) -> str | None:
        if not self.public_base_url:
            return None
        parsed = urlparse(self.public_base_url)
        if not parsed.scheme or not parsed.netloc:
            return None
        return f"{parsed.scheme}://{parsed.netloc}"

    @property
    def allowed_origins(self) -> list[str]:
        origins = {origin.strip() for origin in self.cors_origins.split(",") if origin.strip()}
        if self.public_origin:
            origins.add(self.public_origin)
        return sorted(origins)

    @property
    def trusted_host_list(self) -> list[str]:
        hosts = [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]
        return hosts or ["*"]

    @property
    def resolved_session_cookie_secure(self) -> bool:
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        return bool(self.public_origin and self.public_origin.startswith("https://"))

    @property
    def auth_credentials_configured(self) -> bool:
        return bool(self.auth_password_hash or self.auth_password)

    @property
    def navidrome_configured(self) -> bool:
        return bool(self.navidrome_base_url and self.navidrome_username and self.navidrome_password)

    @property
    def navidrome_partially_configured(self) -> bool:
        values = [self.navidrome_base_url, self.navidrome_username, self.navidrome_password]
        return any(values) and not all(values)

    @property
    def docker_socket_available(self) -> bool:
        return Path(self.docker_socket_path).exists()

    def ensure_storage(self) -> None:
        self.database_file.parent.mkdir(parents=True, exist_ok=True)
        if self.backup_dir_path is not None:
            self.backup_dir_path.mkdir(parents=True, exist_ok=True)

    def validate_runtime(self) -> None:
        if not self.auth_enabled:
            return
        if not self.auth_credentials_configured:
            raise ValueError(
                "Authentication is enabled but AUTH_PASSWORD_HASH or AUTH_PASSWORD is not configured."
            )
        if len(self.auth_secret_key) < 16 or self.auth_secret_key == "change-this-secret-key":
            raise ValueError(
                "Authentication is enabled but AUTH_SECRET_KEY is missing or still using the default value."
            )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_storage()
    settings.validate_runtime()
    return settings
