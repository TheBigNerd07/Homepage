from collections.abc import Callable

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.scripture_catalog import build_scripture_seed
from app.core.time import local_today
from app.db.base import Base
from app.db.session import SessionLocal
from app.models import (
    AppSetting,
    BackupRecord,
    QuickActionLink,
    Reminder,
    SchemaMigration,
    ScriptureChapter,
    ServiceLink,
    ServiceStatusCheck,
)
from app.services.service_health import normalize_service_status


MigrationFunc = Callable[[Session], None]


def _apply_initial_schema(session: Session) -> None:
    Base.metadata.create_all(bind=session.get_bind())


def _ensure_migration_table(session: Session) -> None:
    session.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(120) NOT NULL,
                applied_at DATETIME NOT NULL
            )
            """
        )
    )
    session.commit()


def _seed_settings(session: Session) -> None:
    if session.get(AppSetting, 1):
        return

    session.add(
        AppSetting(
            id=1,
            dashboard_title="PiOne Command Center",
            display_name="Friend",
            accent_color="#5EEAD4",
            morning_intro="Here is your dashboard for today.",
            afternoon_intro="Here is what still matters today.",
            evening_intro="You still have a few things left today.",
            focus_message="Protect the important things before the noisy things.",
            default_reminder_time="08:00",
            show_quotes=True,
            density_mode="comfortable",
            service_categories=["Operations", "Media", "Observability", "Study", "General"],
            default_status_check_interval_seconds=90,
            default_status_check_timeout_seconds=3,
        )
    )


def _seed_services(session: Session) -> None:
    if session.query(ServiceLink).count():
        return

    samples = [
        ServiceLink(
            name="Navidrome",
            icon="Music4",
            description="Streaming music library for the house.",
            category="Media",
            url="http://pione.local:4533",
            open_in_new_tab=True,
            status="online",
            manual_status="online",
            tags=["music", "library"],
            sort_order=1,
            is_favorite=True,
            health_check_url="http://pione.local:4533",
        ),
        ServiceLink(
            name="SLSKD",
            icon="Download",
            description="Soulseek downloads and transfer monitoring.",
            category="Media",
            url="http://pione.local:5030",
            open_in_new_tab=True,
            status="degraded",
            manual_status="degraded",
            tags=["downloads", "sharing"],
            sort_order=2,
        ),
        ServiceLink(
            name="Lidarr",
            icon="Disc3",
            description="Music acquisition and release management.",
            category="Media",
            url="http://pione.local:8686",
            open_in_new_tab=True,
            status="online",
            manual_status="online",
            tags=["automation", "music"],
            sort_order=3,
            health_check_url="http://pione.local:8686",
        ),
        ServiceLink(
            name="Grafana",
            icon="BarChart3",
            description="Metrics dashboards for the homelab.",
            category="Observability",
            url="http://pione.local:3001",
            open_in_new_tab=True,
            status="online",
            manual_status="online",
            tags=["metrics", "dashboards"],
            sort_order=4,
            is_favorite=True,
            health_check_url="http://pione.local:3001",
        ),
        ServiceLink(
            name="Prometheus",
            icon="Activity",
            description="Time-series metrics collection and rules.",
            category="Observability",
            url="http://pione.local:9090",
            open_in_new_tab=True,
            status="online",
            manual_status="online",
            tags=["monitoring", "scrape"],
            sort_order=5,
            health_check_url="http://pione.local:9090/-/healthy",
        ),
        ServiceLink(
            name="Portainer",
            icon="Boxes",
            description="Container management and stack overview.",
            category="Operations",
            url="http://pione.local:9000",
            open_in_new_tab=True,
            status="unknown",
            manual_status="unknown",
            tags=["docker", "ops"],
            sort_order=6,
            is_favorite=True,
            health_check_url="http://pione.local:9000",
        ),
    ]
    session.add_all(samples)


def _seed_quick_actions(session: Session) -> None:
    if session.query(QuickActionLink).count():
        return

    session.add_all(
        [
            QuickActionLink(
                name="Open Portainer",
                icon="Boxes",
                description="Jump straight into container operations.",
                url="http://pione.local:9000",
                sort_order=1,
            ),
            QuickActionLink(
                name="Open Grafana",
                icon="BarChart3",
                description="Open observability dashboards.",
                url="http://pione.local:3001",
                sort_order=2,
            ),
        ]
    )


def _seed_reminders(session: Session) -> None:
    if session.query(Reminder).count():
        return

    today = local_today()
    samples = [
        Reminder(
            text="Review overnight downloads",
            notes="Check SLSKD queue and move anything that needs tagging.",
            schedule_type="daily",
            due_time="08:15",
            sort_order=1,
        ),
        Reminder(
            text="Read one Book of Mormon chapter",
            notes="Use the scripture tracker card to keep the streak alive.",
            schedule_type="daily",
            due_time="07:30",
            sort_order=2,
        ),
        Reminder(
            text="Check PiOne backups",
            notes="Confirm the latest snapshot finished cleanly.",
            schedule_type="once",
            due_date=today,
            due_time="19:00",
            sort_order=3,
        ),
    ]
    session.add_all(samples)


def _seed_scripture_catalog(session: Session) -> None:
    if session.query(ScriptureChapter).count():
        return

    session.add_all(
        [
            ScriptureChapter(
                order_index=seed.order_index,
                book=seed.book,
                chapter_number=seed.chapter_number,
                reference=seed.reference,
                is_completed=False,
            )
            for seed in build_scripture_seed()
        ]
    )


def seed_database(session: Session) -> None:
    _seed_settings(session)
    _seed_services(session)
    _seed_quick_actions(session)
    _seed_reminders(session)
    _seed_scripture_catalog(session)
    session.commit()


def _table_columns(session: Session, table_name: str) -> set[str]:
    return {
        row["name"]
        for row in session.execute(text(f"PRAGMA table_info({table_name})")).mappings().all()
    }


def _add_column_if_missing(session: Session, table_name: str, column_name: str, definition: str) -> None:
    if column_name in _table_columns(session, table_name):
        return
    session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {definition}"))
    session.commit()


def _apply_phase2_schema(session: Session) -> None:
    Base.metadata.create_all(
        bind=session.get_bind(),
        tables=[QuickActionLink.__table__, ServiceStatusCheck.__table__, BackupRecord.__table__],
    )

    _add_column_if_missing(
        session,
        "app_settings",
        "dashboard_title",
        "dashboard_title VARCHAR(120) NOT NULL DEFAULT 'PiOne Command Center'",
    )
    _add_column_if_missing(
        session,
        "app_settings",
        "density_mode",
        "density_mode VARCHAR(20) NOT NULL DEFAULT 'comfortable'",
    )
    _add_column_if_missing(
        session,
        "app_settings",
        "service_categories",
        "service_categories JSON NOT NULL DEFAULT '[\"Operations\", \"Media\", \"Observability\", \"Study\", \"General\"]'",
    )
    _add_column_if_missing(
        session,
        "app_settings",
        "default_status_check_interval_seconds",
        "default_status_check_interval_seconds INTEGER NOT NULL DEFAULT 90",
    )
    _add_column_if_missing(
        session,
        "app_settings",
        "default_status_check_timeout_seconds",
        "default_status_check_timeout_seconds INTEGER NOT NULL DEFAULT 3",
    )

    _add_column_if_missing(
        session,
        "services",
        "manual_status",
        "manual_status VARCHAR(20) NOT NULL DEFAULT 'unknown'",
    )
    _add_column_if_missing(
        session,
        "services",
        "is_favorite",
        "is_favorite BOOLEAN NOT NULL DEFAULT 0",
    )
    _add_column_if_missing(
        session,
        "services",
        "health_check_url",
        "health_check_url VARCHAR(255)",
    )
    _add_column_if_missing(
        session,
        "services",
        "health_check_interval_seconds",
        "health_check_interval_seconds INTEGER",
    )
    _add_column_if_missing(
        session,
        "services",
        "health_check_timeout_seconds",
        "health_check_timeout_seconds INTEGER",
    )
    _add_column_if_missing(
        session,
        "services",
        "last_checked_at",
        "last_checked_at DATETIME",
    )
    _add_column_if_missing(
        session,
        "services",
        "last_response_time_ms",
        "last_response_time_ms INTEGER",
    )
    _add_column_if_missing(
        session,
        "services",
        "last_http_status",
        "last_http_status INTEGER",
    )
    _add_column_if_missing(
        session,
        "services",
        "status_reason",
        "status_reason TEXT NOT NULL DEFAULT ''",
    )

    session.execute(
        text(
            """
            UPDATE app_settings
            SET dashboard_title = COALESCE(NULLIF(dashboard_title, ''), 'PiOne Command Center'),
                density_mode = COALESCE(NULLIF(density_mode, ''), 'comfortable'),
                service_categories = COALESCE(NULLIF(service_categories, ''), '["Operations", "Media", "Observability", "Study", "General"]'),
                default_status_check_interval_seconds = COALESCE(default_status_check_interval_seconds, 90),
                default_status_check_timeout_seconds = COALESCE(default_status_check_timeout_seconds, 3)
            """
        )
    )
    session.commit()

    services = session.query(ServiceLink).all()
    for service in services:
        service.status = normalize_service_status(service.status)
        service.manual_status = normalize_service_status(
            service.manual_status if service.manual_status not in {None, "unknown"} else service.status
        )
        service.status_reason = service.status_reason or ""
        session.add(service)
    session.commit()


MIGRATIONS: list[tuple[int, str, MigrationFunc]] = [
    (1, "initial_schema", _apply_initial_schema),
    (2, "phase2_schema", _apply_phase2_schema),
]


def run_migrations() -> None:
    with SessionLocal() as session:
        _ensure_migration_table(session)
        applied = {
            row[0]
            for row in session.execute(text("SELECT version FROM schema_migrations ORDER BY version")).all()
        }
        for version, name, migration in MIGRATIONS:
            if version in applied:
                continue
            migration(session)
            session.add(SchemaMigration(version=version, name=name))
            session.commit()

        seed_database(session)
