from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ScriptureChapter
from app.schemas.scripture import (
    ReadingHistoryEntry,
    ScriptureChapterRead,
    ScriptureCompleteRequest,
    ScriptureProgressRead,
)
from app.services.scripture import complete_chapter, get_progress, get_reading_history, list_chapters

router = APIRouter(prefix="/scripture", tags=["scripture"])


@router.get("/chapters", response_model=list[ScriptureChapterRead])
def get_chapters(db: Session = Depends(get_db)) -> list[ScriptureChapterRead]:
    return list_chapters(db)


@router.get("/progress", response_model=ScriptureProgressRead)
def get_progress_route(db: Session = Depends(get_db)) -> ScriptureProgressRead:
    return get_progress(db)


@router.get("/history", response_model=list[ReadingHistoryEntry])
def get_history_route(db: Session = Depends(get_db)) -> list[ReadingHistoryEntry]:
    return get_reading_history(db)


@router.post("/complete", response_model=ScriptureProgressRead)
def complete_chapter_route(
    payload: ScriptureCompleteRequest,
    db: Session = Depends(get_db),
) -> ScriptureProgressRead:
    chapter = db.get(ScriptureChapter, payload.chapter_id)
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter not found.")
    return complete_chapter(db, chapter)
