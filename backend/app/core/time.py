from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.config import get_settings


def utc_now() -> datetime:
    return datetime.now(UTC)


def local_zone() -> ZoneInfo:
    return ZoneInfo(get_settings().app_timezone)


def local_now() -> datetime:
    return utc_now().astimezone(local_zone())


def local_today() -> date:
    return local_now().date()


def to_local(value: datetime) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(local_zone())


def day_range(days: int) -> list[date]:
    end = local_today()
    start = end - timedelta(days=days - 1)
    return [start + timedelta(days=index) for index in range(days)]
