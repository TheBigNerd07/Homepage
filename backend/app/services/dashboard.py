from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.briefing import BriefingContext, build_daily_briefing
from app.models import AppSetting, ServiceLink
from app.schemas.dashboard import DashboardSummary
from app.schemas.service import ServiceRead
from app.schemas.settings import SettingRead
from app.services.navidrome import get_navidrome_widget
from app.services.quick_actions import build_dashboard_actions
from app.services.reminders import list_reminders
from app.services.scripture import get_progress
from app.services.service_health import normalize_service_status
from app.services.system import build_system_summary


def get_dashboard_summary(session: Session) -> DashboardSummary:
    settings = SettingRead.model_validate(session.get(AppSetting, 1))
    services = (
        session.execute(
            select(ServiceLink)
            .where(ServiceLink.is_enabled.is_(True))
            .order_by(ServiceLink.sort_order.asc(), ServiceLink.name.asc())
        )
        .scalars()
        .all()
    )
    serialized_services = [ServiceRead.model_validate(service) for service in services]
    status_counts = {"online": 0, "degraded": 0, "offline": 0, "unknown": 0}
    for service in serialized_services:
        status_counts[normalize_service_status(service.status)] += 1
    reminders = list_reminders(session, scope="today")
    scripture = get_progress(session)
    daily_briefing = build_daily_briefing(
        BriefingContext(settings=settings, reminders=reminders, scripture=scripture)
    )

    system_summary = build_system_summary(
        service_count=len(serialized_services),
        online_service_count=status_counts["online"],
        degraded_service_count=status_counts["degraded"],
        offline_service_count=status_counts["offline"],
        unknown_service_count=status_counts["unknown"],
        reminders_due_today=len(reminders),
        reminders_completed_today=len([reminder for reminder in reminders if reminder.completed]),
        scripture_percent_complete=scripture.percent_complete,
    )
    return DashboardSummary(
        settings=settings,
        services=serialized_services,
        quick_actions=build_dashboard_actions(session),
        reminders=reminders,
        scripture=scripture,
        daily_briefing=daily_briefing,
        system_summary=system_summary,
        navidrome=get_navidrome_widget(),
    )
