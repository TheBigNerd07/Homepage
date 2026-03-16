import logging
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def local_zone() -> ZoneInfo:
    timezone_name = get_settings().app_timezone
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        logger.warning("Timezone '%s' is unavailable in this runtime. Falling back to UTC.", timezone_name)
        return ZoneInfo("UTC")


def local_now() -> datetime:
    return utc_now().astimezone(local_zone())


def local_today() -> date:
    return local_now().date()


def to_local(value: datetime) -> datetime:
    return to_utc(value).astimezone(local_zone())


def day_range(days: int) -> list[date]:
    end = local_today()
    start = end - timedelta(days=days - 1)
    return [start + timedelta(days=index) for index in range(days)]
