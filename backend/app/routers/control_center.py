from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ActionResultRead
from app.schemas.control_center import CommandRunResult, ControlCenterSummaryRead, LogRead
from app.services.control_center import (
    build_control_center_summary,
    execute_command,
    execute_control_action,
)
from app.services.logs import read_logs

router = APIRouter(prefix="/control-center", tags=["control-center"])


@router.get("/summary", response_model=ControlCenterSummaryRead)
def control_center_summary(db: Session = Depends(get_db)) -> ControlCenterSummaryRead:
    return build_control_center_summary(db)


@router.post("/actions/{action_key}", response_model=ActionResultRead)
def run_control_action(action_key: str, db: Session = Depends(get_db)) -> ActionResultRead:
    ok, message = execute_control_action(db, action_key)
    if not ok:
        raise HTTPException(status_code=400, detail=message)
    return ActionResultRead(ok=True, message=message)


@router.post("/commands/{command_key}", response_model=CommandRunResult)
def run_command(command_key: str, db: Session = Depends(get_db)) -> CommandRunResult:
    result = execute_command(db, command_key)
    if not result.ok and result.output == "Command not found.":
        raise HTTPException(status_code=404, detail=result.output)
    return result


@router.get("/logs", response_model=LogRead)
def control_center_logs(
    source: str = Query(default="application", min_length=1),
    lines: int = Query(default=120, ge=10, le=400),
) -> LogRead:
    return read_logs(source, lines=lines)
