from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import QuickActionLink
from app.schemas.quick_action import DashboardActionRead, QuickActionLinkRead


def list_quick_action_links(session: Session, *, enabled_only: bool = False) -> list[QuickActionLinkRead]:
    statement = select(QuickActionLink).order_by(QuickActionLink.sort_order.asc(), QuickActionLink.name.asc())
    if enabled_only:
        statement = statement.where(QuickActionLink.is_enabled.is_(True))
    links = session.execute(statement).scalars().all()
    return [QuickActionLinkRead.model_validate(link) for link in links]


def build_dashboard_actions(session: Session) -> list[DashboardActionRead]:
    settings = get_settings()
    actions = [
        DashboardActionRead(
            id="refresh-service-health",
            name="Refresh Status",
            icon="RefreshCw",
            description="Run service health checks right now.",
            kind="backend",
            action_key="refresh_service_checks",
        ),
        DashboardActionRead(
            id="export-backup",
            name="Export Backup",
            icon="Archive",
            description="Download a timestamped backup bundle.",
            kind="download",
            action_key="export_backup",
        ),
        DashboardActionRead(
            id="open-diagnostics",
            name="Open Diagnostics",
            icon="FileSearch",
            description="View backend health, integrations, and recent checks.",
            kind="view",
            action_key="open_diagnostics",
        ),
        DashboardActionRead(
            id="open-settings",
            name="Open Settings",
            icon="Settings2",
            description="Adjust appearance, services, reminders, and links.",
            kind="view",
            action_key="open_settings",
        ),
    ]

    if settings.app_container_name and settings.docker_socket_available:
        actions.append(
            DashboardActionRead(
                id="restart-dashboard",
                name="Restart Dashboard",
                icon="RotateCw",
                description="Restart the dashboard container through Docker.",
                kind="backend",
                action_key="restart_dashboard",
                requires_confirmation=True,
                confirmation_message="Restart the dashboard container now?",
            )
        )

    for link in list_quick_action_links(session, enabled_only=True):
        actions.append(
            DashboardActionRead(
                id=f"link-{link.id}",
                name=link.name,
                icon=link.icon,
                description=link.description or "Open external action link.",
                kind="link",
                url=link.url,
                open_in_new_tab=link.open_in_new_tab,
            )
        )
    return actions
