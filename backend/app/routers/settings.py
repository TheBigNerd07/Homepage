from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException

from app.db.session import get_db
from app.models import AppSetting
from app.schemas.settings import SettingRead, SettingUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingRead)
def get_settings_route(db: Session = Depends(get_db)) -> SettingRead:
    settings = db.get(AppSetting, 1)
    if settings is None:
        raise HTTPException(status_code=404, detail="Settings not found.")
    return SettingRead.model_validate(settings)


@router.put("", response_model=SettingRead)
def update_settings(payload: SettingUpdate, db: Session = Depends(get_db)) -> SettingRead:
    settings = db.get(AppSetting, 1)
    if settings is None:
        raise HTTPException(status_code=404, detail="Settings not found.")

    for field, value in payload.model_dump().items():
        setattr(settings, field, value)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return SettingRead.model_validate(settings)
