from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException

from app.db.session import get_db
from app.models import Note
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.services.notes import create_note, delete_note, list_notes, update_note

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteRead])
def list_notes_route(include_archived: bool = False, db: Session = Depends(get_db)) -> list[NoteRead]:
    return list_notes(db, include_archived=include_archived)


@router.post("", response_model=NoteRead, status_code=201)
def create_note_route(payload: NoteCreate, db: Session = Depends(get_db)) -> NoteRead:
    return create_note(db, payload)


@router.patch("/{note_id}", response_model=NoteRead)
def update_note_route(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)) -> NoteRead:
    note = db.get(Note, note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    return update_note(db, note, payload)


@router.delete("/{note_id}", status_code=204)
def delete_note_route(note_id: int, db: Session = Depends(get_db)) -> None:
    note = db.get(Note, note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    delete_note(db, note)
