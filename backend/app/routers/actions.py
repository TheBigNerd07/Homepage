from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.schemas.common import ActionResultRead
from app.services.docker_host import restart_container
from app.services.service_health import run_due_health_checks

router = APIRouter(prefix="/actions", tags=["actions"])


@router.post("/{action_key}", response_model=ActionResultRead)
def run_action(action_key: str) -> ActionResultRead:
    settings = get_settings()
    if action_key == "refresh_service_checks":
        checked = run_due_health_checks(force=True)
        return ActionResultRead(ok=True, message="Service health checks refreshed.", checked=checked)

    if action_key == "restart_dashboard":
        if not settings.app_container_name:
            raise HTTPException(status_code=400, detail="APP_CONTAINER_NAME is not configured.")
        success, message = restart_container(settings.app_container_name)
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return ActionResultRead(ok=True, message=message)

    raise HTTPException(status_code=404, detail="Action not found.")
