from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException

from app.db.session import get_db
from app.models import QuickActionLink
from app.schemas.quick_action import (
    QuickActionLinkCreate,
    QuickActionLinkRead,
    QuickActionLinkUpdate,
    QuickActionReorderRequest,
)

router = APIRouter(prefix="/quick-actions", tags=["quick-actions"])


@router.get("", response_model=list[QuickActionLinkRead])
def list_quick_actions(db: Session = Depends(get_db)) -> list[QuickActionLinkRead]:
    links = (
        db.execute(select(QuickActionLink).order_by(QuickActionLink.sort_order.asc(), QuickActionLink.name.asc()))
        .scalars()
        .all()
    )
    return [QuickActionLinkRead.model_validate(link) for link in links]


@router.post("", response_model=QuickActionLinkRead, status_code=201)
def create_quick_action(payload: QuickActionLinkCreate, db: Session = Depends(get_db)) -> QuickActionLinkRead:
    link = QuickActionLink(
        **payload.model_dump(),
        sort_order=db.query(QuickActionLink).count() + 1,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return QuickActionLinkRead.model_validate(link)


@router.patch("/{link_id}", response_model=QuickActionLinkRead)
def update_quick_action(
    link_id: int,
    payload: QuickActionLinkUpdate,
    db: Session = Depends(get_db),
) -> QuickActionLinkRead:
    link = db.get(QuickActionLink, link_id)
    if link is None:
        raise HTTPException(status_code=404, detail="Quick action not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(link, field, value)
    db.add(link)
    db.commit()
    db.refresh(link)
    return QuickActionLinkRead.model_validate(link)


@router.put("/reorder", response_model=list[QuickActionLinkRead])
def reorder_quick_actions(
    payload: QuickActionReorderRequest,
    db: Session = Depends(get_db),
) -> list[QuickActionLinkRead]:
    links = (
        db.execute(select(QuickActionLink).where(QuickActionLink.id.in_(payload.ordered_ids)))
        .scalars()
        .all()
    )
    link_map = {link.id: link for link in links}
    if len(link_map) != len(payload.ordered_ids):
        raise HTTPException(status_code=400, detail="One or more quick actions were not found.")

    for index, link_id in enumerate(payload.ordered_ids, start=1):
        link_map[link_id].sort_order = index
        db.add(link_map[link_id])
    db.commit()
    return [QuickActionLinkRead.model_validate(link_map[link_id]) for link_id in payload.ordered_ids]


@router.delete("/{link_id}", status_code=204)
def delete_quick_action(link_id: int, db: Session = Depends(get_db)) -> None:
    link = db.get(QuickActionLink, link_id)
    if link is None:
        raise HTTPException(status_code=404, detail="Quick action not found.")
    db.delete(link)
    db.commit()
