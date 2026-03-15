from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.service import ServiceStatusCheckRead


class DiagnosticsBackupRead(BaseModel):
    filename: str
    created_at: datetime
    size_bytes: int
    stored_path: str | None = None


class IntegrationSummaryRead(BaseModel):
    name: str
    enabled: bool
    available: bool
    detail: str | None = None


class ServiceHealthSummaryRead(BaseModel):
    online: int
    degraded: int
    offline: int
    unknown: int
    recent_checks: list[ServiceStatusCheckRead] = Field(default_factory=list)


class DiagnosticsSummaryRead(BaseModel):
    app_name: str
    app_version: str
    environment: str
    timestamp: datetime
    public_base_url: str | None = None
    backend_health: str
    database_status: str
    database_path: str
    auth_enabled: bool
    auth_username: str | None = None
    last_backup: DiagnosticsBackupRead | None = None
    backup_dir: str | None = None
    service_health: ServiceHealthSummaryRead
    integrations: list[IntegrationSummaryRead] = Field(default_factory=list)
