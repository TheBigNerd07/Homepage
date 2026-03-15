import shutil
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette.background import BackgroundTask

from app.db.session import get_db
from app.services.backup import create_backup_archive

router = APIRouter(prefix="/backups", tags=["backups"])


def _cleanup_export(path: Path) -> None:
    shutil.rmtree(path, ignore_errors=True)


@router.post("/export")
def export_backup(db: Session = Depends(get_db)) -> FileResponse:
    result = create_backup_archive(db)
    return FileResponse(
        path=result.download_path,
        media_type="application/zip",
        filename=result.record.filename,
        background=BackgroundTask(_cleanup_export, result.cleanup_path),
    )
