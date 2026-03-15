from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ActionResultRead
from app.services.control_center import execute_control_action

router = APIRouter(prefix="/actions", tags=["actions"])


@router.post("/{action_key}", response_model=ActionResultRead)
def run_action(action_key: str, db: Session = Depends(get_db)) -> ActionResultRead:
    ok, message = execute_control_action(db, action_key)
    if not ok:
        raise HTTPException(status_code=400, detail=message)
    return ActionResultRead(ok=True, message=message)
