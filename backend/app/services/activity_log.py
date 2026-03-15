from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ActionHistoryEntry
from app.schemas.control_center import HistoryEntryRead


def record_history(
    session: Session,
    *,
    entry_type: str,
    action_key: str,
    title: str,
    category: str,
    status: str,
    output: str,
    duration_ms: int | None = None,
    metadata: dict[str, object] | None = None,
) -> ActionHistoryEntry:
    entry = ActionHistoryEntry(
        entry_type=entry_type,
        action_key=action_key,
        title=title,
        category=category,
        status=status,
        output=output,
        duration_ms=duration_ms,
        metadata_json=metadata or {},
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    _prune_history(session)
    return entry


def _prune_history(session: Session) -> None:
    settings = get_settings()
    stale_ids = (
        session.execute(
            select(ActionHistoryEntry.id)
            .order_by(ActionHistoryEntry.created_at.desc())
            .offset(max(settings.control_recent_history_limit * 5, 100))
        )
        .scalars()
        .all()
    )
    if stale_ids:
        for entry_id in stale_ids:
            session.delete(session.get(ActionHistoryEntry, entry_id))
        session.commit()


def list_history(session: Session, *, limit: int | None = None) -> list[HistoryEntryRead]:
    settings = get_settings()
    rows = (
        session.execute(
            select(ActionHistoryEntry)
            .order_by(ActionHistoryEntry.created_at.desc())
            .limit(limit or settings.control_recent_history_limit)
        )
        .scalars()
        .all()
    )
    return [
        HistoryEntryRead(
            id=row.id,
            entry_type=row.entry_type,
            action_key=row.action_key,
            title=row.title,
            category=row.category,
            status=row.status,
            output=row.output,
            duration_ms=row.duration_ms,
            created_at=row.created_at,
        )
        for row in rows
    ]
