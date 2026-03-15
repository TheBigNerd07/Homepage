from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.time import local_today
from app.models import Reminder, ReminderCompletion
from app.schemas.reminder import (
    ReminderCompletionRead,
    ReminderCreate,
    ReminderRead,
    ReminderToggleRequest,
    ReminderUpdate,
)


def _completion_for_date(reminder: Reminder, target_date: date) -> ReminderCompletion | None:
    return next(
        (completion for completion in reminder.completions if completion.completed_for_date == target_date),
        None,
    )


def _is_due_today(reminder: Reminder, today: date) -> bool:
    if reminder.schedule_type == "daily":
        return True
    return reminder.due_date is not None and reminder.due_date <= today


def reminder_to_read(reminder: Reminder, today: date | None = None) -> ReminderRead:
    current_day = today or local_today()
    completion_today = _completion_for_date(reminder, current_day)
    last_completion = reminder.completions[0] if reminder.completions else None
    completed = completion_today is not None if reminder.schedule_type == "daily" else last_completion is not None
    is_due_today = _is_due_today(reminder, current_day)
    is_overdue = reminder.schedule_type == "once" and reminder.due_date is not None and reminder.due_date < current_day and not completed

    return ReminderRead(
        id=reminder.id,
        text=reminder.text,
        notes=reminder.notes,
        schedule_type=reminder.schedule_type,
        due_date=reminder.due_date,
        due_time=reminder.due_time,
        sort_order=reminder.sort_order,
        is_active=reminder.is_active,
        completed=completed,
        completed_today=completion_today is not None,
        is_due_today=is_due_today,
        is_overdue=is_overdue,
        last_completed_at=last_completion.completed_at if last_completion else None,
        completion_history=[
            ReminderCompletionRead.model_validate(completion) for completion in reminder.completions[:7]
        ],
    )


def list_reminders(session: Session, *, scope: str = "all") -> list[ReminderRead]:
    today = local_today()
    reminders = (
        session.execute(
            select(Reminder)
            .options(selectinload(Reminder.completions))
            .where(Reminder.is_active.is_(True))
            .order_by(Reminder.sort_order.asc(), Reminder.created_at.asc())
        )
        .scalars()
        .all()
    )
    serialized = [reminder_to_read(reminder, today) for reminder in reminders]
    if scope == "today":
        return [
            reminder
            for reminder in serialized
            if reminder.schedule_type == "daily"
            or reminder.is_due_today
            or (reminder.schedule_type == "once" and reminder.completed_today)
        ]
    return serialized


def create_reminder(session: Session, payload: ReminderCreate) -> ReminderRead:
    next_sort_order = session.query(Reminder).count() + 1
    reminder = Reminder(
        text=payload.text,
        notes=payload.notes,
        schedule_type=payload.schedule_type,
        due_date=payload.due_date,
        due_time=payload.due_time,
        sort_order=next_sort_order,
    )
    session.add(reminder)
    session.commit()
    session.refresh(reminder)
    session.refresh(reminder, attribute_names=["completions"])
    return reminder_to_read(reminder)


def update_reminder(session: Session, reminder: Reminder, payload: ReminderUpdate) -> ReminderRead:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    if reminder.schedule_type == "daily":
        reminder.due_date = None
    elif reminder.due_date is None:
        raise ValueError("One-time reminders require a due date.")
    session.add(reminder)
    session.commit()
    session.refresh(reminder)
    session.refresh(reminder, attribute_names=["completions"])
    return reminder_to_read(reminder)


def toggle_reminder_completion(
    session: Session,
    reminder: Reminder,
    payload: ReminderToggleRequest,
) -> ReminderRead:
    target_date = payload.target_date or local_today()
    existing = _completion_for_date(reminder, target_date)

    if payload.completed and existing is None:
        session.add(ReminderCompletion(reminder_id=reminder.id, completed_for_date=target_date))
    if not payload.completed and existing is not None:
        session.delete(existing)

    session.commit()
    session.refresh(reminder)
    session.refresh(reminder, attribute_names=["completions"])
    return reminder_to_read(reminder)


def delete_reminder(session: Session, reminder: Reminder) -> None:
    session.delete(reminder)
    session.commit()
