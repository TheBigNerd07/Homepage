import shutil
import socket
from time import perf_counter

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import AppSetting, QuickActionLink
from app.schemas.control_center import CommandRunResult, ControlCenterSummaryRead, ControlItemRead
from app.schemas.quick_action import DashboardActionRead
from app.services.activity_log import list_history, record_history
from app.services.docker_host import list_containers, restart_containers
from app.services.logs import list_log_sources, read_logs
from app.services.nodes import run_due_node_checks
from app.services.service_health import run_due_health_checks


def _favorite_keys(settings) -> set[str]:
    return set(settings.favorite_command_keys or [])


def build_dashboard_actions(session: Session) -> list[DashboardActionRead]:
    settings = get_settings()
    actions = [
        DashboardActionRead(
            id="refresh-service-health",
            name="Refresh Status",
            icon="RefreshCw",
            description="Run service and node health checks right now.",
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
            id="open-control-center",
            name="Control Center",
            icon="TerminalSquare",
            description="Open safe commands, logs, and maintenance actions.",
            kind="view",
            action_key="open_control_center",
        ),
        DashboardActionRead(
            id="open-nodes",
            name="Nodes",
            icon="Network",
            description="Inspect node status and service placement.",
            kind="view",
            action_key="open_nodes",
        ),
    ]

    if settings.stack_restart_targets and settings.docker_socket_available:
        actions.append(
            DashboardActionRead(
                id="restart-dashboard",
                name="Restart Stack",
                icon="RotateCw",
                description="Restart the configured dashboard containers.",
                kind="backend",
                action_key="restart_dashboard_stack",
                requires_confirmation=True,
                confirmation_message="Restart the dashboard stack now?",
            )
        )
    return actions


def build_control_center_summary(session: Session) -> ControlCenterSummaryRead:
    app_settings = session.get(AppSetting, 1)
    if app_settings is None:
        app_settings = AppSetting(id=1)
    favorite_keys = _favorite_keys(app_settings)
    runtime_settings = get_settings()
    actions = [
        ControlItemRead(
            id="nav-dashboard",
            title="Open Dashboard",
            description="Return to the main dashboard view.",
            category="navigation",
            kind="view",
            icon="LayoutDashboard",
            action_key="open_dashboard",
        ),
        ControlItemRead(
            id="nav-nodes",
            title="Open Nodes",
            description="Inspect per-node health and relationships.",
            category="navigation",
            kind="view",
            icon="Network",
            action_key="open_nodes",
        ),
        ControlItemRead(
            id="nav-notes",
            title="Open Notes",
            description="Jump to the scratchpad and pinned notes.",
            category="navigation",
            kind="view",
            icon="NotebookTabs",
            action_key="open_notes",
        ),
        ControlItemRead(
            id="nav-diagnostics",
            title="Open Diagnostics",
            description="Review runtime health and integration state.",
            category="diagnostics",
            kind="view",
            icon="FileSearch",
            action_key="open_diagnostics",
        ),
        ControlItemRead(
            id="refresh-checks",
            title="Refresh Health Checks",
            description="Force service and node status probes now.",
            category="maintenance",
            kind="action",
            icon="RefreshCw",
            action_key="refresh_service_checks",
        ),
    ]

    if runtime_settings.stack_restart_targets and runtime_settings.docker_socket_available:
        actions.append(
            ControlItemRead(
                id="restart-stack",
                title="Restart Dashboard Stack",
                description="Restart the configured dashboard containers.",
                category="container-actions",
                kind="action",
                icon="RotateCw",
                action_key="restart_dashboard_stack",
                requires_confirmation=True,
                confirmation_message="Restart the dashboard stack now?",
            )
        )

    for link in (
        session.query(QuickActionLink)
        .filter(QuickActionLink.is_enabled.is_(True))
        .order_by(QuickActionLink.sort_order.asc(), QuickActionLink.name.asc())
        .all()
    ):
        actions.append(
            ControlItemRead(
                id=f"link-{link.id}",
                title=link.name,
                description=link.description or "Open a configured homelab destination.",
                category="navigation",
                kind="link",
                icon=link.icon,
                url=link.url,
                open_in_new_tab=link.open_in_new_tab,
            )
        )

    commands = [
        ControlItemRead(
            id="command-disk-usage",
            title="Disk Usage",
            description="Summarize local disk consumption for the data volume.",
            category="maintenance",
            kind="command",
            icon="HardDrive",
            command_key="disk_usage",
            is_favorite="disk_usage" in favorite_keys,
        ),
        ControlItemRead(
            id="command-uptime",
            title="Uptime",
            description="Show current uptime, load, and temperature.",
            category="diagnostics",
            kind="command",
            icon="TimerReset",
            command_key="uptime",
            is_favorite="uptime" in favorite_keys,
        ),
        ControlItemRead(
            id="command-hostname",
            title="Hostname",
            description="Show the configured host identity for this installation.",
            category="diagnostics",
            kind="command",
            icon="Server",
            command_key="hostname",
            is_favorite="hostname" in favorite_keys,
        ),
        ControlItemRead(
            id="command-app-logs",
            title="Tail App Logs",
            description="Read the most recent backend application log lines.",
            category="diagnostics",
            kind="command",
            icon="ScrollText",
            command_key="app_logs",
            is_favorite="app_logs" in favorite_keys,
        ),
    ]

    if runtime_settings.docker_socket_available:
        commands.insert(
            0,
            ControlItemRead(
                id="command-docker-ps",
                title="docker ps",
                description="Read-only container summary from the Docker socket.",
                category="container-actions",
                kind="command",
                icon="Boxes",
                command_key="docker_ps",
                is_favorite="docker_ps" in favorite_keys,
            ),
        )

    if runtime_settings.stack_restart_targets and runtime_settings.docker_socket_available:
        commands.append(
            ControlItemRead(
                id="command-restart-stack",
                title="Restart Dashboard Stack",
                description="Safely restart the configured containers.",
                category="container-actions",
                kind="command",
                icon="RotateCw",
                command_key="restart_dashboard_stack",
                requires_confirmation=True,
                confirmation_message="Restart the dashboard stack now?",
                is_favorite="restart_dashboard_stack" in favorite_keys,
            )
        )

    return ControlCenterSummaryRead(
        actions=actions,
        commands=commands,
        recent_history=list_history(session),
        log_sources=list_log_sources(),
    )


def _format_table(headers: list[str], rows: list[list[str]]) -> str:
    widths = [len(header) for header in headers]
    for row in rows:
        for index, value in enumerate(row):
            widths[index] = max(widths[index], len(value))
    divider = "  ".join("-" * width for width in widths)
    lines = ["  ".join(header.ljust(widths[index]) for index, header in enumerate(headers)), divider]
    for row in rows:
        lines.append("  ".join(value.ljust(widths[index]) for index, value in enumerate(row)))
    return "\n".join(lines)


def execute_control_action(session: Session, action_key: str) -> tuple[bool, str]:
    started = perf_counter()
    if action_key == "refresh_service_checks":
        checked = run_due_health_checks(force=True)
        node_checks = run_due_node_checks(force=True)
        elapsed = int((perf_counter() - started) * 1000)
        message = f"Health checks refreshed for {checked} service endpoint(s) and {node_checks} node endpoint(s)."
        record_history(
            session,
            entry_type="action",
            action_key=action_key,
            title="Refresh Health Checks",
            category="maintenance",
            status="success",
            output=message,
            duration_ms=elapsed,
        )
        return True, message

    if action_key == "restart_dashboard_stack":
        success, message = restart_containers(get_settings().stack_restart_targets)
        elapsed = int((perf_counter() - started) * 1000)
        record_history(
            session,
            entry_type="action",
            action_key=action_key,
            title="Restart Dashboard Stack",
            category="container-actions",
            status="success" if success else "error",
            output=message,
            duration_ms=elapsed,
        )
        return success, message

    return False, "Action not found."


def execute_command(session: Session, command_key: str) -> CommandRunResult:
    started = perf_counter()
    settings = get_settings()
    title = command_key
    status = "success"

    if command_key == "docker_ps":
        title = "docker ps"
        containers = list_containers()
        output = _format_table(
            ["NAME", "IMAGE", "STATE", "STATUS"],
            [[container.name, container.image, container.state, container.status] for container in containers[:12]],
        ) if containers else "Docker is unavailable or no containers were found."
    elif command_key == "disk_usage":
        title = "Disk Usage"
        usage = shutil.disk_usage(settings.database_file.parent)
        output = (
            f"Filesystem target: {settings.database_file.parent}\n"
            f"Used: {usage.used / 1024 / 1024 / 1024:.1f} GB\n"
            f"Total: {usage.total / 1024 / 1024 / 1024:.1f} GB\n"
            f"Free: {usage.free / 1024 / 1024 / 1024:.1f} GB"
        )
    elif command_key == "uptime":
        title = "Uptime"
        from app.services.system import _HOST_MONITOR

        sample = _HOST_MONITOR.get_snapshot(force=True)
        output = (
            f"Uptime: {sample.uptime_label or 'Unavailable'}\n"
            f"CPU: {sample.cpu_usage_percent if sample.cpu_usage_percent is not None else 'N/A'}%\n"
            f"Load: {' / '.join(str(value) for value in sample.load_average) or 'Unavailable'}\n"
            f"Temperature: {sample.temperature_c if sample.temperature_c is not None else 'N/A'} C"
        )
    elif command_key == "hostname":
        title = "Hostname"
        output = f"Configured host: {settings.lab_hostname}\nSystem hostname: {socket.gethostname()}"
    elif command_key == "app_logs":
        title = "Tail App Logs"
        output = "\n".join(read_logs("application", lines=80).lines)
    elif command_key == "restart_dashboard_stack":
        title = "Restart Dashboard Stack"
        success, output = restart_containers(settings.stack_restart_targets)
        status = "success" if success else "error"
    else:
        status = "error"
        output = "Command not found."

    duration_ms = int((perf_counter() - started) * 1000)
    entry = record_history(
        session,
        entry_type="command",
        action_key=command_key,
        title=title,
        category="command",
        status=status,
        output=output,
        duration_ms=duration_ms,
    )
    return CommandRunResult(
        command_key=command_key,
        title=title,
        ok=status == "success",
        status=status,
        output=output,
        duration_ms=duration_ms,
        created_at=entry.created_at,
    )
