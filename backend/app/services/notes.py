from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Note
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate


def list_notes(session: Session, *, include_archived: bool = False) -> list[NoteRead]:
    statement = select(Note).order_by(Note.is_pinned.desc(), Note.sort_order.asc(), Note.updated_at.desc())
    if not include_archived:
        statement = statement.where(Note.is_archived.is_(False))
    notes = session.execute(statement).scalars().all()
    return [NoteRead.model_validate(note) for note in notes]


def create_note(session: Session, payload: NoteCreate) -> NoteRead:
    note = Note(
        title=payload.title.strip(),
        body=payload.body.strip(),
        is_pinned=payload.is_pinned,
        is_dashboard_pinned=payload.is_dashboard_pinned,
        is_archived=payload.is_archived,
        sort_order=session.query(Note).count() + 1,
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return NoteRead.model_validate(note)


def update_note(session: Session, note: Note, payload: NoteUpdate) -> NoteRead:
    for field, value in payload.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = value.strip()
        setattr(note, field, value)
    session.add(note)
    session.commit()
    session.refresh(note)
    return NoteRead.model_validate(note)


def delete_note(session: Session, note: Note) -> None:
    session.delete(note)
    session.commit()
