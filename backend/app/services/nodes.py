from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.time import utc_now
from app.db.session import SessionLocal
from app.models import LabNode, MetricSample, NodeStatusCheck, ServiceLink
from app.schemas.common import ChartPoint
from app.schemas.node import NodeStatusCheckRead, NodeSummaryRead
from app.services.service_health import _request_health, normalize_service_status


def ensure_local_node(session: Session) -> LabNode:
    settings = get_settings()
    local_node = session.execute(select(LabNode).where(LabNode.is_local.is_(True))).scalar_one_or_none()
    if local_node is not None:
        return local_node

    local_node = LabNode(
        name=settings.lab_hostname,
        hostname=settings.lab_hostname,
        role="Primary",
        description="Primary homelab node hosting the dashboard and core services.",
        metrics_source="local",
        tags=["local", "primary"],
        sort_order=1,
        is_local=True,
        is_enabled=True,
        status="online",
        status_reason="Local node.",
    )
    session.add(local_node)
    session.commit()
    session.refresh(local_node)
    return local_node


def list_nodes(session: Session, *, include_disabled: bool = True) -> list[LabNode]:
    statement = select(LabNode).order_by(LabNode.sort_order.asc(), LabNode.name.asc())
    if not include_disabled:
        statement = statement.where(LabNode.is_enabled.is_(True))
    return session.execute(statement).scalars().all()


def _aggregate_service_counts(services: list[ServiceLink]) -> dict[int | None, dict[str, int]]:
    counts: dict[int | None, dict[str, int]] = defaultdict(
        lambda: {"service_count": 0, "online": 0, "degraded": 0, "offline": 0, "unknown": 0}
    )
    for service in services:
        node_counts = counts[service.node_id]
        node_counts["service_count"] += 1
        node_counts[normalize_service_status(service.status)] += 1
    return counts


def _status_history(session: Session, node_id: int) -> list[NodeStatusCheckRead]:
    rows = (
        session.execute(
            select(NodeStatusCheck)
            .where(NodeStatusCheck.node_id == node_id)
            .order_by(NodeStatusCheck.checked_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )
    return [
        NodeStatusCheckRead(
            id=row.id,
            node_id=row.node_id,
            status=row.status,
            checked_at=row.checked_at,
            response_time_ms=row.response_time_ms,
            http_status=row.http_status,
            message=row.message,
        )
        for row in rows
    ]


def _metric_trend(session: Session, node_id: int | None, field_name: str) -> list[ChartPoint]:
    statement = select(MetricSample).order_by(MetricSample.recorded_at.desc()).limit(12)
    if node_id is None:
        statement = statement.where(MetricSample.node_id.is_(None))
    else:
        statement = statement.where(MetricSample.node_id == node_id)
    rows = list(reversed(session.execute(statement).scalars().all()))
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


def _resolve_node_status(node: LabNode, counts: dict[str, int]) -> str:
    endpoint_status = normalize_service_status(node.status)
    if counts["service_count"] == 0:
        return endpoint_status if endpoint_status != "unknown" else ("online" if node.is_local else "unknown")
    if counts["offline"] and counts["offline"] == counts["service_count"]:
        service_status = "offline"
    elif counts["offline"] or counts["degraded"]:
        service_status = "degraded"
    elif counts["online"]:
        service_status = "online"
    else:
        service_status = "unknown"

    order = {"online": 0, "unknown": 1, "degraded": 2, "offline": 3}
    return endpoint_status if order[endpoint_status] >= order[service_status] else service_status


def build_node_summaries(session: Session, services: list[ServiceLink] | None = None) -> list[NodeSummaryRead]:
    nodes = list_nodes(session, include_disabled=False)
    if not nodes:
        return []

    service_rows = services or (
        session.execute(select(ServiceLink).where(ServiceLink.is_enabled.is_(True))).scalars().all()
    )
    counts = _aggregate_service_counts(service_rows)

    summaries: list[NodeSummaryRead] = []
    for node in nodes:
        node_counts = counts[node.id]
        status = _resolve_node_status(node, node_counts)
        latest_sample = session.execute(
            select(MetricSample)
            .where(MetricSample.node_id == node.id)
            .order_by(MetricSample.recorded_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        summaries.append(
            NodeSummaryRead(
                id=node.id,
                name=node.name,
                hostname=node.hostname,
                role=node.role,
                description=node.description,
                status_endpoint=node.status_endpoint,
                metrics_source=node.metrics_source,
                tags=node.tags,
                sort_order=node.sort_order,
                is_enabled=node.is_enabled,
                is_local=node.is_local,
                status=status,
                status_reason=node.status_reason,
                service_count=node_counts["service_count"],
                online_service_count=node_counts["online"],
                degraded_service_count=node_counts["degraded"],
                offline_service_count=node_counts["offline"],
                unknown_service_count=node_counts["unknown"],
                last_checked_at=node.last_checked_at,
                last_response_time_ms=node.last_response_time_ms,
                last_http_status=node.last_http_status,
                last_metric_at=latest_sample.recorded_at if latest_sample else None,
                cpu_usage_percent=float(latest_sample.cpu_usage_percent) if latest_sample and latest_sample.cpu_usage_percent is not None else None,
                memory_used_percent=float(latest_sample.memory_used_percent) if latest_sample and latest_sample.memory_used_percent is not None else None,
                disk_used_percent=float(latest_sample.disk_used_percent) if latest_sample and latest_sample.disk_used_percent is not None else None,
                status_history=_status_history(session, node.id),
                cpu_trend=_metric_trend(session, node.id, "cpu_usage_percent"),
                memory_trend=_metric_trend(session, node.id, "memory_used_percent"),
            )
        )
    return summaries


def _prune_history(session: Session, node_id: int) -> None:
    stale_ids = (
        session.execute(
            select(NodeStatusCheck.id)
            .where(NodeStatusCheck.node_id == node_id)
            .order_by(NodeStatusCheck.checked_at.desc())
            .offset(30)
        )
        .scalars()
        .all()
    )
    if stale_ids:
        session.execute(delete(NodeStatusCheck).where(NodeStatusCheck.id.in_(stale_ids)))
        session.commit()


def run_due_node_checks(*, force: bool = False) -> int:
    with SessionLocal() as session:
        ensure_local_node(session)
        settings = get_settings()
        interval_seconds = settings.default_status_check_interval_seconds
        timeout_seconds = settings.default_status_check_timeout_seconds
        now = utc_now()
        checked = 0
        nodes = list_nodes(session, include_disabled=False)

        for node in nodes:
            if node.is_local:
                node.status = "online"
                node.status_reason = "Local metrics available."
                session.add(node)
                continue

            if not node.status_endpoint:
                node.status = normalize_service_status(node.status)
                node.status_reason = node.status_reason or "No node endpoint configured."
                session.add(node)
                continue

            if (
                not force
                and node.last_checked_at is not None
                and (now - node.last_checked_at).total_seconds() < interval_seconds
            ):
                continue

            result = _request_health(node.status_endpoint, timeout_seconds)
            node.status = result.status
            node.last_checked_at = now
            node.last_response_time_ms = result.response_time_ms
            node.last_http_status = result.http_status
            node.status_reason = result.message
            session.add(node)
            session.add(
                NodeStatusCheck(
                    node_id=node.id,
                    status=result.status,
                    checked_at=now,
                    response_time_ms=result.response_time_ms,
                    http_status=result.http_status,
                    message=result.message,
                )
            )
            checked += 1

        session.commit()

        for node in nodes:
            _prune_history(session, node.id)

    return checked
