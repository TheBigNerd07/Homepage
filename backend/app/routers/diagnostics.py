from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.diagnostics import DiagnosticsSummaryRead
from app.services.diagnostics import build_diagnostics_summary

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


@router.get("/summary", response_model=DiagnosticsSummaryRead)
def diagnostics_summary(db: Session = Depends(get_db)) -> DiagnosticsSummaryRead:
    return build_diagnostics_summary(db)
