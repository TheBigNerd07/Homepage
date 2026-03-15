from collections import defaultdict
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.time import day_range, local_today, to_local, utc_now
from app.db.session import SessionLocal
from app.models import LabNode, MetricSample, ScriptureChapter, ServiceLink, ServiceStatusCheck
from app.schemas.common import ChartPoint
from app.schemas.dashboard import DashboardMetricsRead, ReadingTrendPoint, ServiceAvailabilityRead
from app.services.nodes import ensure_local_node
from app.services.reminders import list_reminders
from app.services.scripture import get_progress
from app.services.service_health import normalize_service_status
from app.services.system import _HOST_MONITOR


def _prune_metric_samples(session: Session, node_id: int | None) -> None:
    settings = get_settings()
    statement = select(MetricSample.id).order_by(MetricSample.recorded_at.desc()).offset(settings.metric_sample_retention_count)
    if node_id is None:
        statement = statement.where(MetricSample.node_id.is_(None))
    else:
        statement = statement.where(MetricSample.node_id == node_id)
    stale_ids = session.execute(statement).scalars().all()
    if stale_ids:
        for sample_id in stale_ids:
            session.delete(session.get(MetricSample, sample_id))
        session.commit()


def record_metric_sample(*, force: bool = False) -> None:
    settings = get_settings()
    with SessionLocal() as session:
        local_node = ensure_local_node(session)
        latest = session.execute(
            select(MetricSample)
            .where(MetricSample.node_id == local_node.id)
            .order_by(MetricSample.recorded_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        if (
            latest is not None
            and not force
            and (utc_now() - latest.recorded_at).total_seconds() < settings.metric_sample_interval_seconds
        ):
            return

        services = session.execute(select(ServiceLink).where(ServiceLink.is_enabled.is_(True))).scalars().all()
        counts = defaultdict(int)
        for service in services:
            counts[normalize_service_status(service.status)] += 1
        reminders = list_reminders(session, scope="today")
        scripture = get_progress(session)
        sample = _HOST_MONITOR.get_snapshot(force=True)

        session.add(
            MetricSample(
                node_id=local_node.id,
                recorded_at=utc_now(),
                cpu_usage_percent=sample.cpu_usage_percent,
                memory_used_percent=sample.memory.used_percent,
                disk_used_percent=sample.disk.used_percent,
                online_service_count=counts["online"],
                degraded_service_count=counts["degraded"],
                offline_service_count=counts["offline"],
                reminder_open_count=len([reminder for reminder in reminders if not reminder.completed]),
                reading_percent_complete=scripture.percent_complete,
                reading_streak=scripture.current_streak,
            )
        )
        session.commit()
        _prune_metric_samples(session, local_node.id)


def _trend_points(session: Session, node_id: int, field_name: str) -> list[ChartPoint]:
    rows = list(
        reversed(
            session.execute(
                select(MetricSample)
                .where(MetricSample.node_id == node_id)
                .order_by(MetricSample.recorded_at.desc())
                .limit(24)
            )
            .scalars()
            .all()
        )
    )
    points: list[ChartPoint] = []
    for row in rows:
        raw_value = getattr(row, field_name)
        points.append(
            ChartPoint(
                label=row.recorded_at.strftime("%H:%M"),
                timestamp=row.recorded_at.isoformat(),
                value=float(raw_value) if raw_value is not None else None,
            )
        )
    return points


def _reading_trend(session: Session) -> list[ReadingTrendPoint]:
    chapters = session.execute(select(ScriptureChapter).order_by(ScriptureChapter.order_index.asc())).scalars().all()
    completions_by_day: dict[object, int] = defaultdict(int)
    for chapter in chapters:
        if chapter.completed_at is None:
            continue
        completions_by_day[to_local(chapter.completed_at).date()] += 1

    days = day_range(14)
    start_day = days[0]
    running_completed = sum(
        count for day, count in completions_by_day.items() if day < start_day
    )
    day_set = {day for day, count in completions_by_day.items() if count}
    trend: list[ReadingTrendPoint] = []
    streak = 0
    previous_day = None
    total_count = len(chapters) or 1
    for day in days:
        running_completed += completions_by_day.get(day, 0)
        if day in day_set:
            if previous_day is not None and day == previous_day + timedelta(days=1):
                streak += 1
            else:
                streak = 1
            previous_day = day
        elif day == local_today():
            streak = streak
        trend.append(
            ReadingTrendPoint(
                date=day.isoformat(),
                completed_count=completions_by_day.get(day, 0),
                percent_complete=round((running_completed / total_count) * 100, 1),
                streak=streak if day in day_set else 0,
            )
        )
    return trend


def _service_availability(session: Session) -> list[ServiceAvailabilityRead]:
    services = session.execute(
        select(ServiceLink).where(ServiceLink.is_enabled.is_(True)).order_by(ServiceLink.is_favorite.desc(), ServiceLink.name.asc())
    ).scalars().all()
    rows = session.execute(
        select(ServiceStatusCheck).order_by(ServiceStatusCheck.checked_at.desc()).limit(200)
    ).scalars().all()
    grouped: dict[int, list[ServiceStatusCheck]] = defaultdict(list)
    for row in rows:
        if len(grouped[row.service_id]) < 10:
            grouped[row.service_id].append(row)

    availability: list[ServiceAvailabilityRead] = []
    for service in services:
        checks = list(reversed(grouped.get(service.id, [])))
        if checks:
            score = 0.0
            for check in checks:
                if check.status == "online":
                    score += 1
                elif check.status == "degraded":
                    score += 0.5
            uptime = round((score / len(checks)) * 100, 1)
        else:
            uptime = 0.0
        availability.append(
            ServiceAvailabilityRead(
                service_id=service.id,
                service_name=service.name,
                node_name=service.node.name if service.node else None,
                uptime_percent=uptime,
                recent_statuses=[check.status for check in checks],
                last_checked_at=service.last_checked_at,
            )
        )
    return availability[:8]


def build_dashboard_metrics(session: Session) -> DashboardMetricsRead:
    local_node = session.execute(select(LabNode).where(LabNode.is_local.is_(True))).scalar_one_or_none()
    if local_node is None:
        local_node = ensure_local_node(session)
    return DashboardMetricsRead(
        cpu_trend=_trend_points(session, local_node.id, "cpu_usage_percent"),
        memory_trend=_trend_points(session, local_node.id, "memory_used_percent"),
        disk_trend=_trend_points(session, local_node.id, "disk_used_percent"),
        reading_trend=_reading_trend(session),
        service_availability=_service_availability(session),
    )
