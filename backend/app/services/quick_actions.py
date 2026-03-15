from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import QuickActionLink
from app.schemas.quick_action import QuickActionLinkRead


def list_quick_action_links(session: Session, *, enabled_only: bool = False) -> list[QuickActionLinkRead]:
    statement = select(QuickActionLink).order_by(QuickActionLink.sort_order.asc(), QuickActionLink.name.asc())
    if enabled_only:
        statement = statement.where(QuickActionLink.is_enabled.is_(True))
    links = session.execute(statement).scalars().all()
    return [QuickActionLinkRead.model_validate(link) for link in links]
