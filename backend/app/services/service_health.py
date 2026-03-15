import asyncio
import logging
from dataclasses import dataclass
from time import perf_counter
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import delete, select

from app.core.config import get_settings
from app.core.time import utc_now
from app.db.session import SessionLocal
from app.models import AppSetting, ServiceLink, ServiceStatus, ServiceStatusCheck

logger = logging.getLogger(__name__)


def normalize_service_status(value: str | None) -> str:
    mapping = {
        None: ServiceStatus.UNKNOWN.value,
        "healthy": ServiceStatus.ONLINE.value,
        "attention": ServiceStatus.DEGRADED.value,
        "online": ServiceStatus.ONLINE.value,
        "degraded": ServiceStatus.DEGRADED.value,
        "offline": ServiceStatus.OFFLINE.value,
        "unknown": ServiceStatus.UNKNOWN.value,
    }
    normalized = mapping.get(value.lower() if isinstance(value, str) else value)
    return normalized or ServiceStatus.UNKNOWN.value


def apply_manual_service_status(service: ServiceLink) -> None:
    service.manual_status = normalize_service_status(service.manual_status)
    if not service.health_check_url:
        service.status = service.manual_status
        service.last_checked_at = None
        service.last_response_time_ms = None
        service.last_http_status = None
        service.status_reason = ""


@dataclass(slots=True)
class HealthCheckResult:
    status: str
    response_time_ms: int | None
    http_status: int | None
    message: str


def _request_health(url: str, timeout_seconds: int) -> HealthCheckResult:
    started = perf_counter()
    request = Request(url, headers={"User-Agent": "PiOne-Homepage/3.0"})
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            response.read(1)
            elapsed_ms = int((perf_counter() - started) * 1000)
            status_code = getattr(response, "status", 200)
            status = ServiceStatus.ONLINE.value if 200 <= status_code < 400 else ServiceStatus.DEGRADED.value
            message = "Health check succeeded." if status == ServiceStatus.ONLINE.value else f"HTTP {status_code}"
            return HealthCheckResult(
                status=status,
                response_time_ms=elapsed_ms,
                http_status=status_code,
                message=message,
            )
    except HTTPError as exc:
        elapsed_ms = int((perf_counter() - started) * 1000)
        return HealthCheckResult(
            status=ServiceStatus.DEGRADED.value,
            response_time_ms=elapsed_ms,
            http_status=exc.code,
            message=f"HTTP {exc.code}",
        )
    except URLError as exc:
        return HealthCheckResult(
            status=ServiceStatus.OFFLINE.value,
            response_time_ms=None,
            http_status=None,
            message=str(exc.reason),
        )
    except TimeoutError:
        return HealthCheckResult(
            status=ServiceStatus.OFFLINE.value,
            response_time_ms=None,
            http_status=None,
            message="Timed out.",
        )


def _prune_service_history(service_id: int) -> None:
    with SessionLocal() as session:
        stale_ids = (
            session.execute(
                select(ServiceStatusCheck.id)
                .where(ServiceStatusCheck.service_id == service_id)
                .order_by(ServiceStatusCheck.checked_at.desc())
                .offset(30)
            )
            .scalars()
            .all()
        )
        if stale_ids:
            session.execute(delete(ServiceStatusCheck).where(ServiceStatusCheck.id.in_(stale_ids)))
            session.commit()


def run_due_health_checks(*, force: bool = False) -> int:
    with SessionLocal() as session:
        settings_row = session.get(AppSetting, 1)
        default_interval = settings_row.default_status_check_interval_seconds if settings_row else 90
        default_timeout = settings_row.default_status_check_timeout_seconds if settings_row else 3
        now = utc_now()
        checked = 0

        services = (
            session.execute(select(ServiceLink).where(ServiceLink.is_enabled.is_(True)).order_by(ServiceLink.sort_order.asc()))
            .scalars()
            .all()
        )

        for service in services:
            apply_manual_service_status(service)
            if not service.health_check_url:
                session.add(service)
                continue

            interval_seconds = service.health_check_interval_seconds or default_interval
            timeout_seconds = service.health_check_timeout_seconds or default_timeout
            if (
                not force
                and service.last_checked_at is not None
                and (now - service.last_checked_at).total_seconds() < interval_seconds
            ):
                continue

            result = _request_health(service.health_check_url, timeout_seconds)
            service.status = result.status
            service.last_checked_at = now
            service.last_response_time_ms = result.response_time_ms
            service.last_http_status = result.http_status
            service.status_reason = result.message
            session.add(service)
            session.add(
                ServiceStatusCheck(
                    service_id=service.id,
                    status=result.status,
                    checked_at=now,
                    response_time_ms=result.response_time_ms,
                    http_status=result.http_status,
                    message=result.message,
                )
            )
            checked += 1

        session.commit()

    if checked:
        for service in services:
            if service.health_check_url:
                _prune_service_history(service.id)
    return checked


class ServiceHealthMonitor:
    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    async def start(self) -> None:
        if self._task is not None:
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run(), name="service-health-monitor")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._stop_event.set()
        await self._task
        self._task = None

    async def _run(self) -> None:
        settings = get_settings()
        while not self._stop_event.is_set():
            try:
                await asyncio.to_thread(run_due_health_checks)
                from app.services.nodes import run_due_node_checks
                from app.services.telemetry import record_metric_sample

                await asyncio.to_thread(run_due_node_checks)
                await asyncio.to_thread(record_metric_sample)
            except Exception:
                logger.exception("Service health monitor iteration failed.")
            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=settings.service_monitor_tick_seconds)
            except TimeoutError:
                continue


service_health_monitor = ServiceHealthMonitor()
