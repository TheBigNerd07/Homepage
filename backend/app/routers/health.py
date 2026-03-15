from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.core.time import utc_now
from app.db.session import get_db
from app.schemas.common import HealthRead

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthRead)
def healthcheck(db: Session = Depends(get_db)) -> HealthRead:
    db.execute(text("SELECT 1"))
    return HealthRead(status="ok", database="ok", timestamp=utc_now().isoformat())
