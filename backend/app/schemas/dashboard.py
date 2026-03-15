from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ChartPoint
from app.schemas.control_center import ControlItemRead
from app.schemas.navidrome import NavidromeWidgetRead
from app.schemas.node import NodeSummaryRead
from app.schemas.note import NoteRead
from app.schemas.quick_action import DashboardActionRead
from app.schemas.reminder import ReminderRead
from app.schemas.scripture import ScriptureProgressRead
from app.schemas.service import ServiceRead
from app.schemas.settings import SettingRead


class MemoryStats(BaseModel):
    used_mb: int | None = None
    total_mb: int | None = None
    available_mb: int | None = None
    used_percent: float | None = None


class DiskStats(BaseModel):
    used_gb: float | None = None
    total_gb: float | None = None
    used_percent: float | None = None


class NetworkStats(BaseModel):
    rx_total_bytes: int | None = None
    tx_total_bytes: int | None = None
    rx_bytes_per_second: float | None = None
    tx_bytes_per_second: float | None = None


class DockerStats(BaseModel):
    available: bool = False
    container_count: int | None = None
    running_count: int | None = None
    healthy_count: int | None = None
    unhealthy_count: int | None = None


class SystemSummary(BaseModel):
    hostname: str
    actual_hostname: str
    architecture: str
    platform: str
    cpu_usage_percent: float | None = None
    load_average: list[float] = Field(default_factory=list)
    uptime_seconds: float | None = None
    uptime_label: str | None = None
    memory: MemoryStats = Field(default_factory=MemoryStats)
    disk: DiskStats = Field(default_factory=DiskStats)
    temperature_c: float | None = None
    network: NetworkStats = Field(default_factory=NetworkStats)
    docker: DockerStats = Field(default_factory=DockerStats)
    service_count: int
    online_service_count: int
    degraded_service_count: int
    offline_service_count: int
    unknown_service_count: int
    reminders_due_today: int
    reminders_completed_today: int
    scripture_percent_complete: float
    last_updated_at: datetime | None = None
    cpu_trend: list[ChartPoint] = Field(default_factory=list)
    memory_trend: list[ChartPoint] = Field(default_factory=list)
    disk_trend: list[ChartPoint] = Field(default_factory=list)


class BriefingQuote(BaseModel):
    text: str
    author: str


class DailyBriefing(BaseModel):
    greeting: str
    segment: str
    day_label: str
    summary_text: str
    priorities: list[str] = Field(default_factory=list)
    focus_message: str
    reading_prompt: str | None = None
    motivational_message: str | None = None
    quote: BriefingQuote | None = None
    system_status_line: str | None = None
    scripture_of_the_day: str | None = None
    widget_summaries: list[str] = Field(default_factory=list)


class ServiceAvailabilityRead(BaseModel):
    service_id: int
    service_name: str
    node_name: str | None = None
    uptime_percent: float
    recent_statuses: list[str] = Field(default_factory=list)
    last_checked_at: datetime | None = None


class ReadingTrendPoint(BaseModel):
    date: str
    completed_count: int
    percent_complete: float
    streak: int


class DashboardMetricsRead(BaseModel):
    cpu_trend: list[ChartPoint] = Field(default_factory=list)
    memory_trend: list[ChartPoint] = Field(default_factory=list)
    disk_trend: list[ChartPoint] = Field(default_factory=list)
    reading_trend: list[ReadingTrendPoint] = Field(default_factory=list)
    service_availability: list[ServiceAvailabilityRead] = Field(default_factory=list)


class DashboardDiagnosticsRead(BaseModel):
    backend_health: str
    database_status: str
    last_backup_at: datetime | None = None
    integrations_available_count: int = 0
    integrations_total_count: int = 0
    last_health_check_at: datetime | None = None


class DashboardSummary(BaseModel):
    settings: SettingRead
    services: list[ServiceRead]
    nodes: list[NodeSummaryRead] = Field(default_factory=list)
    dashboard_actions: list[DashboardActionRead] = Field(default_factory=list)
    control_actions: list[ControlItemRead] = Field(default_factory=list)
    reminders: list[ReminderRead]
    notes: list[NoteRead] = Field(default_factory=list)
    scripture: ScriptureProgressRead
    daily_briefing: DailyBriefing
    system_summary: SystemSummary
    metrics: DashboardMetricsRead = Field(default_factory=DashboardMetricsRead)
    diagnostics: DashboardDiagnosticsRead
    navidrome: NavidromeWidgetRead = Field(default_factory=lambda: NavidromeWidgetRead(enabled=False, available=False))
