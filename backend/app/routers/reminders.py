from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db.session import get_db
from app.models import Reminder
from app.schemas.reminder import ReminderCreate, ReminderRead, ReminderToggleRequest, ReminderUpdate
from app.services.reminders import (
    create_reminder,
    delete_reminder,
    list_reminders,
    toggle_reminder_completion,
    update_reminder,
)

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderRead])
def get_reminders(
    scope: str = Query(default="all", pattern="^(all|today)$"),
    db: Session = Depends(get_db),
) -> list[ReminderRead]:
    return list_reminders(db, scope=scope)


@router.post("", response_model=ReminderRead, status_code=201)
def create_reminder_route(payload: ReminderCreate, db: Session = Depends(get_db)) -> ReminderRead:
    return create_reminder(db, payload)


def _get_reminder(db: Session, reminder_id: int) -> Reminder:
    reminder = (
        db.execute(
            select(Reminder)
            .options(selectinload(Reminder.completions))
            .where(Reminder.id == reminder_id)
        )
        .scalars()
        .first()
    )
    if reminder is None:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderRead)
def update_reminder_route(
    reminder_id: int,
    payload: ReminderUpdate,
    db: Session = Depends(get_db),
) -> ReminderRead:
    reminder = _get_reminder(db, reminder_id)
    try:
        return update_reminder(db, reminder, payload)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/{reminder_id}/toggle", response_model=ReminderRead)
def toggle_reminder(
    reminder_id: int,
    payload: ReminderToggleRequest,
    db: Session = Depends(get_db),
) -> ReminderRead:
    reminder = _get_reminder(db, reminder_id)
    return toggle_reminder_completion(db, reminder, payload)


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder_route(reminder_id: int, db: Session = Depends(get_db)) -> None:
    reminder = _get_reminder(db, reminder_id)
    delete_reminder(db, reminder)
