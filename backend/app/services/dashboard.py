from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.briefing import BriefingContext, build_daily_briefing
from app.models import AppSetting, BackupRecord, ServiceLink, ServiceStatusCheck
from app.schemas.dashboard import DashboardDiagnosticsRead, DashboardSummary
from app.schemas.settings import SettingRead
from app.services.control_center import build_control_center_summary, build_dashboard_actions
from app.services.navidrome import get_navidrome_widget
from app.services.nodes import build_node_summaries, ensure_local_node
from app.services.notes import list_notes
from app.services.reminders import list_reminders
from app.services.scripture import get_progress
from app.services.service_health import normalize_service_status
from app.services.service_links import service_to_read
from app.services.system import build_system_summary
from app.services.telemetry import build_dashboard_metrics, record_metric_sample


def get_dashboard_summary(session: Session) -> DashboardSummary:
    record_metric_sample()
    ensure_local_node(session)
    settings_row = session.get(AppSetting, 1)
    settings = SettingRead.model_validate(settings_row)
    services = (
        session.execute(
            select(ServiceLink)
            .options(joinedload(ServiceLink.node))
            .where(ServiceLink.is_enabled.is_(True))
            .order_by(ServiceLink.sort_order.asc(), ServiceLink.name.asc())
        )
        .scalars()
        .all()
    )
    serialized_services = [service_to_read(service) for service in services]
    status_counts = {"online": 0, "degraded": 0, "offline": 0, "unknown": 0}
    for service in serialized_services:
        status_counts[normalize_service_status(service.status)] += 1

    reminders = list_reminders(session, scope="today")
    notes = list_notes(session, include_archived=False)
    scripture = get_progress(session)
    node_summaries = build_node_summaries(session, services)
    metrics = build_dashboard_metrics(session)
    control_center = build_control_center_summary(session)

    system_summary = build_system_summary(
        service_count=len(serialized_services),
        online_service_count=status_counts["online"],
        degraded_service_count=status_counts["degraded"],
        offline_service_count=status_counts["offline"],
        unknown_service_count=status_counts["unknown"],
        reminders_due_today=len(reminders),
        reminders_completed_today=len([reminder for reminder in reminders if reminder.completed]),
        scripture_percent_complete=scripture.percent_complete,
        cpu_trend=metrics.cpu_trend,
        memory_trend=metrics.memory_trend,
        disk_trend=metrics.disk_trend,
    )
    daily_briefing = build_daily_briefing(
        BriefingContext(
            settings=settings,
            reminders=reminders,
            scripture=scripture,
            nodes=node_summaries,
            services=serialized_services,
            notes=notes,
            metrics=metrics,
            system_summary=system_summary,
        )
    )
    latest_backup = session.execute(
        select(BackupRecord).order_by(BackupRecord.created_at.desc()).limit(1)
    ).scalar_one_or_none()
    last_check = session.execute(
        select(ServiceStatusCheck.checked_at).order_by(ServiceStatusCheck.checked_at.desc()).limit(1)
    ).scalar_one_or_none()

    return DashboardSummary(
        settings=settings,
        services=serialized_services,
        nodes=node_summaries,
        dashboard_actions=build_dashboard_actions(session),
        control_actions=control_center.actions[:8],
        reminders=reminders,
        notes=notes[:6],
        scripture=scripture,
        daily_briefing=daily_briefing,
        system_summary=system_summary,
        metrics=metrics,
        diagnostics=DashboardDiagnosticsRead(
            backend_health="ok",
            database_status="ok",
            last_backup_at=latest_backup.created_at if latest_backup else None,
            integrations_available_count=sum(1 for item in control_center.log_sources if item.available),
            integrations_total_count=len(control_center.log_sources),
            last_health_check_at=last_check,
        ),
        navidrome=get_navidrome_widget(),
    )
