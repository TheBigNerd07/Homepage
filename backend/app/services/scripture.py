from collections import Counter
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.scripture_catalog import TOTAL_BOOK_OF_MORMON_CHAPTERS
from app.core.time import day_range, local_today, to_local, utc_now
from app.models import ScriptureChapter
from app.schemas.scripture import HeatmapDay, ReadingHistoryEntry, ScriptureChapterRead, ScriptureProgressRead


def list_chapters(session: Session) -> list[ScriptureChapterRead]:
    chapters = (
        session.execute(select(ScriptureChapter).order_by(ScriptureChapter.order_index.asc()))
        .scalars()
        .all()
    )
    return [ScriptureChapterRead.model_validate(chapter) for chapter in chapters]


def _completion_days(chapters: list[ScriptureChapter]) -> list:
    return sorted({to_local(chapter.completed_at).date() for chapter in chapters if chapter.completed_at})


def _current_streak(days: list) -> int:
    if not days:
        return 0
    day_set = set(days)
    latest = max(day_set)
    today = local_today()
    if latest < today - timedelta(days=1):
        return 0
    streak = 0
    cursor = latest
    while cursor in day_set:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _longest_streak(days: list) -> int:
    if not days:
        return 0
    longest = 0
    current = 0
    previous = None
    for day in days:
        if previous is None or day == previous + timedelta(days=1):
            current += 1
        else:
            current = 1
        longest = max(longest, current)
        previous = day
    return longest


def get_progress(session: Session) -> ScriptureProgressRead:
    chapters = (
        session.execute(select(ScriptureChapter).order_by(ScriptureChapter.order_index.asc()))
        .scalars()
        .all()
    )
    completed = [chapter for chapter in chapters if chapter.is_completed and chapter.completed_at]
    completion_days = _completion_days(completed)
    today = local_today()
    counts = Counter(to_local(chapter.completed_at).date() for chapter in completed)

    next_chapter = next((chapter for chapter in chapters if not chapter.is_completed), None)
    last_completed = completed[-1] if completed else None
    current_reference = next_chapter.reference if next_chapter else (last_completed.reference if last_completed else None)
    recent_history = sorted(completed, key=lambda chapter: chapter.completed_at, reverse=True)[:8]

    heatmap = []
    max_count = max(counts.values(), default=0)
    for day in day_range(84):
        count = counts.get(day, 0)
        if max_count == 0 or count == 0:
            level = 0
        elif count == 1:
            level = 1
        elif count == 2:
            level = 2
        elif count == 3:
            level = 3
        else:
            level = 4
        heatmap.append(HeatmapDay(date=day, count=count, level=level))

    completed_count = len(completed)
    return ScriptureProgressRead(
        completed_count=completed_count,
        total_count=TOTAL_BOOK_OF_MORMON_CHAPTERS,
        percent_complete=round((completed_count / TOTAL_BOOK_OF_MORMON_CHAPTERS) * 100, 1),
        today_completed=today in completion_days,
        current_streak=_current_streak(completion_days),
        longest_streak=_longest_streak(completion_days),
        current_reference=current_reference,
        suggested_next_reference=next_chapter.reference if next_chapter else None,
        recent_history=[
            ReadingHistoryEntry(
                chapter_id=chapter.id,
                reference=chapter.reference,
                completed_at=chapter.completed_at,
            )
            for chapter in recent_history
        ],
        heatmap=heatmap,
    )


def get_reading_history(session: Session) -> list[ReadingHistoryEntry]:
    chapters = (
        session.execute(
            select(ScriptureChapter)
            .where(ScriptureChapter.is_completed.is_(True))
            .order_by(ScriptureChapter.completed_at.desc())
        )
        .scalars()
        .all()
    )
    return [
        ReadingHistoryEntry(
            chapter_id=chapter.id,
            reference=chapter.reference,
            completed_at=chapter.completed_at,
        )
        for chapter in chapters
        if chapter.completed_at is not None
    ]


def complete_chapter(session: Session, chapter: ScriptureChapter) -> ScriptureProgressRead:
    if not chapter.is_completed:
        chapter.is_completed = True
        chapter.completed_at = utc_now()
        session.add(chapter)
        session.commit()
    return get_progress(session)
