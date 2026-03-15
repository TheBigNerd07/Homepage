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
from app.models import (
    ActionHistoryEntry,
    AppSetting,
    BackupRecord,
    LabNode,
    MetricSample,
    Note,
    QuickActionLink,
    Reminder,
    ScriptureChapter,
    ServiceLink,
)
from app.schemas.node import NodeSummaryRead
from app.schemas.note import NoteRead
from app.schemas.quick_action import QuickActionLinkRead
from app.schemas.service import ServiceRead
from app.schemas.settings import SettingRead
from app.services.nodes import build_node_summaries
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
    nodes = session.execute(select(LabNode).order_by(LabNode.sort_order.asc(), LabNode.name.asc())).scalars().all()
    notes = session.execute(select(Note).order_by(Note.sort_order.asc(), Note.updated_at.desc())).scalars().all()
    action_history = session.execute(
        select(ActionHistoryEntry).order_by(ActionHistoryEntry.created_at.desc()).limit(50)
    ).scalars().all()
    metric_samples = session.execute(
        select(MetricSample).order_by(MetricSample.recorded_at.desc()).limit(100)
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
            "exports/nodes.json",
            _json_bytes([node.model_dump(mode="json") for node in build_node_summaries(session, services)]),
        )
        archive.writestr(
            "exports/reminders.json",
            _json_bytes([reminder.model_dump(mode="json") for reminder in reminder_export]),
        )
        archive.writestr(
            "exports/notes.json",
            _json_bytes([NoteRead.model_validate(note).model_dump(mode="json") for note in notes]),
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
            "exports/action-history.json",
            _json_bytes(
                [
                    {
                        "created_at": entry.created_at.isoformat(),
                        "entry_type": entry.entry_type,
                        "action_key": entry.action_key,
                        "title": entry.title,
                        "category": entry.category,
                        "status": entry.status,
                        "output": entry.output,
                        "duration_ms": entry.duration_ms,
                    }
                    for entry in action_history
                ]
            ),
        )
        archive.writestr(
            "exports/metric-samples.json",
            _json_bytes(
                [
                    {
                        "recorded_at": sample.recorded_at.isoformat(),
                        "node_id": sample.node_id,
                        "cpu_usage_percent": float(sample.cpu_usage_percent) if sample.cpu_usage_percent is not None else None,
                        "memory_used_percent": float(sample.memory_used_percent) if sample.memory_used_percent is not None else None,
                        "disk_used_percent": float(sample.disk_used_percent) if sample.disk_used_percent is not None else None,
                        "online_service_count": sample.online_service_count,
                        "degraded_service_count": sample.degraded_service_count,
                        "offline_service_count": sample.offline_service_count,
                        "reminder_open_count": sample.reminder_open_count,
                        "reading_percent_complete": float(sample.reading_percent_complete) if sample.reading_percent_complete is not None else None,
                        "reading_streak": sample.reading_streak,
                    }
                    for sample in metric_samples
                ]
            ),
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
