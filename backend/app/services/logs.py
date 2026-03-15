from pathlib import Path

from app.core.config import get_settings
from app.core.time import utc_now
from app.schemas.control_center import LogRead, LogSourceRead
from app.services.docker_host import get_container_logs


def list_log_sources() -> list[LogSourceRead]:
    settings = get_settings()
    sources = [
        LogSourceRead(
            id="application",
            label="Application Log",
            description="Backend rotating log file for the dashboard.",
            available=settings.app_log_file.exists(),
        )
    ]
    if settings.app_container_name and settings.docker_socket_available:
        sources.append(
            LogSourceRead(
                id="dashboard_container",
                label="Dashboard Container",
                description=f"Docker logs for {settings.app_container_name}.",
                available=True,
            )
        )
    return sources


def _tail_file(path: Path, lines: int) -> list[str]:
    if not path.exists():
        return ["Log file is not available yet."]
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        content = handle.readlines()
    return [line.rstrip("\n") for line in content[-lines:]]


def read_logs(source: str, *, lines: int = 120) -> LogRead:
    settings = get_settings()
    if source == "application":
        return LogRead(source=source, fetched_at=utc_now(), lines=_tail_file(settings.app_log_file, lines))
    if source == "dashboard_container" and settings.app_container_name and settings.docker_socket_available:
        return LogRead(
            source=source,
            fetched_at=utc_now(),
            lines=get_container_logs(settings.app_container_name, tail=lines),
        )
    return LogRead(source=source, fetched_at=utc_now(), lines=["Requested log source is unavailable."])
