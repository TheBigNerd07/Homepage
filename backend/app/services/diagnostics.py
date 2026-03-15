from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.time import utc_now
from app.models import BackupRecord, ServiceLink, ServiceStatusCheck
from app.schemas.diagnostics import (
    DiagnosticsBackupRead,
    DiagnosticsSummaryRead,
    IntegrationSummaryRead,
    ServiceHealthSummaryRead,
)
from app.schemas.service import ServiceStatusCheckRead
from app.services.docker_host import get_docker_availability
from app.services.navidrome import get_navidrome_widget
from app.services.service_health import normalize_service_status


def build_diagnostics_summary(session: Session) -> DiagnosticsSummaryRead:
    settings = get_settings()
    session.execute(text("SELECT 1"))

    services = session.execute(select(ServiceLink).where(ServiceLink.is_enabled.is_(True))).scalars().all()
    counts = {"online": 0, "degraded": 0, "offline": 0, "unknown": 0}
    for service in services:
        counts[normalize_service_status(service.status)] += 1

    recent_checks = (
        session.execute(
            select(ServiceStatusCheck, ServiceLink.name)
            .join(ServiceLink, ServiceLink.id == ServiceStatusCheck.service_id)
            .order_by(ServiceStatusCheck.checked_at.desc())
            .limit(10)
        )
        .all()
    )
    recent_check_reads = [
        ServiceStatusCheckRead(
            id=check.id,
            service_id=check.service_id,
            service_name=name,
            status=check.status,
            checked_at=check.checked_at,
            response_time_ms=check.response_time_ms,
            http_status=check.http_status,
            message=check.message,
        )
        for check, name in recent_checks
    ]

    last_backup_row = session.execute(
        select(BackupRecord).order_by(BackupRecord.created_at.desc()).limit(1)
    ).scalar_one_or_none()
    last_backup = None
    if last_backup_row is not None:
        last_backup = DiagnosticsBackupRead(
            filename=last_backup_row.filename,
            created_at=last_backup_row.created_at,
            size_bytes=last_backup_row.size_bytes,
            stored_path=last_backup_row.stored_path,
        )

    navidrome = get_navidrome_widget()
    docker = get_docker_availability()

    integrations = [
        IntegrationSummaryRead(
            name="Authentication",
            enabled=settings.auth_enabled,
            available=not settings.auth_enabled or bool(settings.auth_credentials_configured),
            detail=(
                f"Single admin user: {settings.auth_admin_username}"
                if settings.auth_enabled
                else "Authentication disabled."
            ),
        ),
        IntegrationSummaryRead(
            name="Navidrome",
            enabled=settings.navidrome_configured or settings.navidrome_partially_configured,
            available=navidrome.available,
            detail=navidrome.message,
        ),
        IntegrationSummaryRead(
            name="Docker Socket",
            enabled=settings.docker_socket_available,
            available=docker.available,
            detail=docker.detail,
        ),
        IntegrationSummaryRead(
            name="Backup Directory",
            enabled=bool(settings.backup_dir_path),
            available=bool(settings.backup_dir_path and settings.backup_dir_path.exists()),
            detail=str(settings.backup_dir_path) if settings.backup_dir_path else "Disabled.",
        ),
        IntegrationSummaryRead(
            name="Public URL",
            enabled=bool(settings.public_base_url),
            available=bool(settings.public_base_url),
            detail=settings.public_base_url or "Local-only deployment.",
        ),
    ]

    return DiagnosticsSummaryRead(
        app_name=settings.app_name,
        app_version=settings.app_version,
        environment=settings.environment,
        timestamp=utc_now(),
        public_base_url=settings.public_base_url,
        backend_health="ok",
        database_status="ok",
        database_path=settings.database_path,
        auth_enabled=settings.auth_enabled,
        auth_username=settings.auth_admin_username if settings.auth_enabled else None,
        last_backup=last_backup,
        backup_dir=str(settings.backup_dir_path) if settings.backup_dir_path else None,
        service_health=ServiceHealthSummaryRead(
            online=counts["online"],
            degraded=counts["degraded"],
            offline=counts["offline"],
            unknown=counts["unknown"],
            recent_checks=recent_check_reads,
        ),
        integrations=integrations,
    )
