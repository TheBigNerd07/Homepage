from app.models import ServiceLink
from app.schemas.service import ServiceRead


def service_to_read(service: ServiceLink) -> ServiceRead:
    return ServiceRead(
        id=service.id,
        name=service.name,
        icon=service.icon,
        description=service.description,
        category=service.category,
        url=service.url,
        open_in_new_tab=service.open_in_new_tab,
        status=service.status,
        manual_status=service.manual_status,
        tags=service.tags,
        node_id=service.node_id,
        node_name=service.node.name if service.node else None,
        node_hostname=service.node.hostname if service.node else None,
        sort_order=service.sort_order,
        is_enabled=service.is_enabled,
        is_favorite=service.is_favorite,
        health_check_url=service.health_check_url,
        health_check_interval_seconds=service.health_check_interval_seconds,
        health_check_timeout_seconds=service.health_check_timeout_seconds,
        last_checked_at=service.last_checked_at,
        last_response_time_ms=service.last_response_time_ms,
        last_http_status=service.last_http_status,
        status_reason=service.status_reason,
        has_health_check=service.has_health_check,
    )
