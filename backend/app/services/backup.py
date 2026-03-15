import json
import shutil
import sqlite3
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.time import utc_now
from app.models import AppSetting, BackupRecord, QuickActionLink, Reminder, ScriptureChapter, ServiceLink
from app.schemas.quick_action import QuickActionLinkRead
from app.schemas.service import ServiceRead
from app.schemas.settings import SettingRead
from app.services.quick_actions import list_quick_action_links
from app.services.reminders import list_reminders
from app.services.scripture import get_progress, list_chapters


@dataclass(slots=True)
class BackupExportResult:
    download_path: Path
    cleanup_path: Path
    record: BackupRecord


def _snapshot_database(source_path: Path, destination_path: Path) -> None:
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(source_path) as source, sqlite3.connect(destination_path) as destination:
        source.backup(destination)


def _json_bytes(value) -> bytes:
    return json.dumps(value, indent=2, sort_keys=True).encode("utf-8")


def create_backup_archive(session: Session) -> BackupExportResult:
    settings = get_settings()
    timestamp = utc_now().strftime("%Y%m%d-%H%M%S")
    temp_root = Path(tempfile.mkdtemp(prefix="pione-backup-"))
    export_root = temp_root / "export"
    export_root.mkdir(parents=True, exist_ok=True)

    database_copy = export_root / settings.database_file.name
    _snapshot_database(settings.database_file, database_copy)

    settings_row = session.get(AppSetting, 1)
    services = session.execute(select(ServiceLink).order_by(ServiceLink.sort_order.asc())).scalars().all()
    reminder_export = list_reminders(session, scope="all")
    quick_actions = session.execute(
        select(QuickActionLink).order_by(QuickActionLink.sort_order.asc(), QuickActionLink.name.asc())
    ).scalars().all()

    zip_name = f"pione-homepage-backup-{timestamp}.zip"
    zip_path = temp_root / zip_name
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.write(database_copy, arcname=f"database/{database_copy.name}")
        archive.writestr(
            "exports/settings.json",
            _json_bytes(SettingRead.model_validate(settings_row).model_dump(mode="json") if settings_row else {}),
        )
        archive.writestr(
            "exports/services.json",
            _json_bytes([ServiceRead.model_validate(service).model_dump(mode="json") for service in services]),
        )
        archive.writestr(
            "exports/reminders.json",
            _json_bytes([reminder.model_dump(mode="json") for reminder in reminder_export]),
        )
        archive.writestr(
            "exports/scripture-progress.json",
            _json_bytes(get_progress(session).model_dump(mode="json")),
        )
        archive.writestr(
            "exports/scripture-chapters.json",
            _json_bytes([chapter.model_dump(mode="json") for chapter in list_chapters(session)]),
        )
        archive.writestr(
            "exports/quick-actions.json",
            _json_bytes([QuickActionLinkRead.model_validate(action).model_dump(mode="json") for action in quick_actions]),
        )
        archive.writestr(
            "metadata/export.json",
            _json_bytes(
                {
                    "exported_at": utc_now().isoformat(),
                    "app_name": settings.app_name,
                    "app_version": settings.app_version,
                    "environment": settings.environment,
                    "public_base_url": settings.public_base_url,
                }
            ),
        )

    final_download_path = zip_path
    stored_path: str | None = None
    if settings.backup_dir_path is not None:
        final_download_path = settings.backup_dir_path / zip_name
        shutil.copy2(zip_path, final_download_path)
        stored_path = str(final_download_path)

    record = BackupRecord(
        filename=zip_name,
        size_bytes=final_download_path.stat().st_size,
        stored_path=stored_path,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return BackupExportResult(
        download_path=final_download_path,
        cleanup_path=temp_root,
        record=record,
    )
