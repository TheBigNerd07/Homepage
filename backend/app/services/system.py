import os
import platform
import shutil
import socket
import time
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

from app.core.config import get_settings
from app.core.time import utc_now
from app.schemas.dashboard import DiskStats, DockerStats, MemoryStats, NetworkStats, SystemSummary
from app.services.docker_host import get_docker_availability


@dataclass(slots=True)
class _HostSample:
    collected_at_monotonic: float
    collected_at: object
    cpu_total: int
    cpu_idle: int
    rx_bytes: int
    tx_bytes: int
    cpu_usage_percent: float | None
    network: NetworkStats
    memory: MemoryStats
    disk: DiskStats
    temperature_c: float | None
    uptime_seconds: float | None
    uptime_label: str | None
    load_average: list[float]


class HostMonitor:
    def __init__(self) -> None:
        self._lock = Lock()
        self._sample: _HostSample | None = None

    def _read_proc_stat(self) -> tuple[int, int]:
        try:
            with open("/proc/stat", "r", encoding="utf-8") as handle:
                values = handle.readline().split()[1:]
            numbers = [int(value) for value in values]
            total = sum(numbers)
            idle = numbers[3] + (numbers[4] if len(numbers) > 4 else 0)
            return total, idle
        except (FileNotFoundError, ValueError, IndexError):
            return 0, 0

    def _read_meminfo(self) -> MemoryStats:
        try:
            with open("/proc/meminfo", "r", encoding="utf-8") as handle:
                values = {}
                for line in handle:
                    key, raw = line.split(":", 1)
                    values[key] = int(raw.strip().split()[0])
            total = round(values["MemTotal"] / 1024)
            available = round(values["MemAvailable"] / 1024)
            used = max(total - available, 0)
            used_percent = round((used / total) * 100, 1) if total else None
            return MemoryStats(
                total_mb=total,
                available_mb=available,
                used_mb=used,
                used_percent=used_percent,
            )
        except (FileNotFoundError, KeyError, ValueError):
            return MemoryStats()

    def _read_disk(self) -> DiskStats:
        settings = get_settings()
        target = settings.database_file.parent
        usage = shutil.disk_usage(target if target.exists() else Path("/"))
        total_gb = round(usage.total / 1024 / 1024 / 1024, 1)
        used_gb = round(usage.used / 1024 / 1024 / 1024, 1)
        used_percent = round((usage.used / usage.total) * 100, 1) if usage.total else None
        return DiskStats(total_gb=total_gb, used_gb=used_gb, used_percent=used_percent)

    def _read_uptime(self) -> tuple[float | None, str | None]:
        try:
            with open("/proc/uptime", "r", encoding="utf-8") as handle:
                seconds = float(handle.read().split()[0])
            days, remainder = divmod(int(seconds), 86400)
            hours, remainder = divmod(remainder, 3600)
            minutes, _ = divmod(remainder, 60)
            if days:
                label = f"{days}d {hours}h"
            elif hours:
                label = f"{hours}h {minutes}m"
            else:
                label = f"{minutes}m"
            return seconds, label
        except (FileNotFoundError, ValueError):
            return None, None

    def _read_temperature(self) -> float | None:
        for candidate in (
            "/sys/class/thermal/thermal_zone0/temp",
            "/sys/devices/virtual/thermal/thermal_zone0/temp",
        ):
            try:
                with open(candidate, "r", encoding="utf-8") as handle:
                    raw_value = handle.read().strip()
                return round(int(raw_value) / 1000, 1)
            except (FileNotFoundError, ValueError):
                continue
        return None

    def _read_network_totals(self) -> tuple[int, int]:
        rx_total = 0
        tx_total = 0
        try:
            with open("/proc/net/dev", "r", encoding="utf-8") as handle:
                for line in handle.readlines()[2:]:
                    interface, raw_stats = line.split(":", 1)
                    if interface.strip() == "lo":
                        continue
                    values = raw_stats.split()
                    rx_total += int(values[0])
                    tx_total += int(values[8])
        except (FileNotFoundError, ValueError, IndexError):
            return 0, 0
        return rx_total, tx_total

    def get_snapshot(self, *, force: bool = False) -> _HostSample:
        with self._lock:
            previous = self._sample
            if previous and not force and time.monotonic() - previous.collected_at_monotonic < 15:
                return previous

            total, idle = self._read_proc_stat()
            rx_total, tx_total = self._read_network_totals()
            collected_at_monotonic = time.monotonic()
            collected_at = utc_now()

            cpu_usage_percent = None
            network = NetworkStats(rx_total_bytes=rx_total, tx_total_bytes=tx_total)
            if previous is not None:
                total_delta = total - previous.cpu_total
                idle_delta = idle - previous.cpu_idle
                if total_delta > 0:
                    cpu_usage_percent = round((1 - (idle_delta / total_delta)) * 100, 1)
                elapsed = collected_at_monotonic - previous.collected_at_monotonic
                if elapsed > 0:
                    network.rx_bytes_per_second = round((rx_total - previous.rx_bytes) / elapsed, 1)
                    network.tx_bytes_per_second = round((tx_total - previous.tx_bytes) / elapsed, 1)

            try:
                load_average = [round(value, 2) for value in os.getloadavg()]
            except OSError:
                load_average = []
            uptime_seconds, uptime_label = self._read_uptime()

            self._sample = _HostSample(
                collected_at_monotonic=collected_at_monotonic,
                collected_at=collected_at,
                cpu_total=total,
                cpu_idle=idle,
                rx_bytes=rx_total,
                tx_bytes=tx_total,
                cpu_usage_percent=cpu_usage_percent,
                network=network,
                memory=self._read_meminfo(),
                disk=self._read_disk(),
                temperature_c=self._read_temperature(),
                uptime_seconds=uptime_seconds,
                uptime_label=uptime_label,
                load_average=load_average,
            )
            return self._sample


_HOST_MONITOR = HostMonitor()


def build_system_summary(
    *,
    service_count: int,
    online_service_count: int,
    degraded_service_count: int,
    offline_service_count: int,
    unknown_service_count: int,
    reminders_due_today: int,
    reminders_completed_today: int,
    scripture_percent_complete: float,
    cpu_trend: list | None = None,
    memory_trend: list | None = None,
    disk_trend: list | None = None,
) -> SystemSummary:
    settings = get_settings()
    sample = _HOST_MONITOR.get_snapshot()
    docker = get_docker_availability()

    return SystemSummary(
        hostname=settings.lab_hostname,
        actual_hostname=socket.gethostname(),
        architecture=platform.machine(),
        platform=platform.platform(),
        cpu_usage_percent=sample.cpu_usage_percent,
        load_average=sample.load_average,
        uptime_seconds=sample.uptime_seconds,
        uptime_label=sample.uptime_label,
        memory=sample.memory,
        disk=sample.disk,
        temperature_c=sample.temperature_c,
        network=sample.network,
        docker=DockerStats(
            available=docker.available,
            container_count=docker.container_count,
            running_count=docker.running_count,
            healthy_count=docker.healthy_count,
            unhealthy_count=docker.unhealthy_count,
        ),
        service_count=service_count,
        online_service_count=online_service_count,
        degraded_service_count=degraded_service_count,
        offline_service_count=offline_service_count,
        unknown_service_count=unknown_service_count,
        reminders_due_today=reminders_due_today,
        reminders_completed_today=reminders_completed_today,
        scripture_percent_complete=scripture_percent_complete,
        last_updated_at=sample.collected_at,
        cpu_trend=cpu_trend or [],
        memory_trend=memory_trend or [],
        disk_trend=disk_trend or [],
    )
