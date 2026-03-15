import http.client
import json
import socket
from dataclasses import dataclass
from threading import Lock
from time import monotonic
from urllib.parse import quote

from app.core.config import get_settings


class UnixSocketHTTPConnection(http.client.HTTPConnection):
    def __init__(self, socket_path: str, timeout: int = 3) -> None:
        super().__init__("localhost", timeout=timeout)
        self.socket_path = socket_path

    def connect(self) -> None:
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.socket_path)


@dataclass(slots=True)
class DockerAvailability:
    available: bool
    container_count: int | None = None
    running_count: int | None = None
    healthy_count: int | None = None
    unhealthy_count: int | None = None
    detail: str | None = None


_CACHE_LOCK = Lock()
_CACHE_TTL_SECONDS = 15
_SUMMARY_CACHE: tuple[float, DockerAvailability] | None = None


def _request(method: str, path: str, *, timeout: int = 3) -> tuple[int, bytes]:
    settings = get_settings()
    connection = UnixSocketHTTPConnection(settings.docker_socket_path, timeout=timeout)
    connection.request(method, path, headers={"Host": "localhost"})
    response = connection.getresponse()
    data = response.read()
    connection.close()
    return response.status, data


def get_docker_availability(*, force: bool = False) -> DockerAvailability:
    global _SUMMARY_CACHE

    settings = get_settings()
    if not settings.docker_socket_available:
        return DockerAvailability(available=False, detail="Docker socket not mounted.")

    with _CACHE_LOCK:
        if not force and _SUMMARY_CACHE is not None:
            cached_at, cached_value = _SUMMARY_CACHE
            if monotonic() - cached_at < _CACHE_TTL_SECONDS:
                return cached_value

    try:
        status_code, payload = _request("GET", "/containers/json?all=1")
        if status_code >= 400:
            result = DockerAvailability(available=False, detail=f"Docker API returned {status_code}.")
        else:
            containers = json.loads(payload.decode("utf-8"))
            running = 0
            healthy = 0
            unhealthy = 0
            for container in containers:
                state = str(container.get("State", "")).lower()
                status_text = str(container.get("Status", "")).lower()
                if state == "running":
                    running += 1
                if "(unhealthy)" in status_text or state in {"dead", "exited", "restarting"}:
                    unhealthy += 1
                elif state == "running":
                    healthy += 1
            result = DockerAvailability(
                available=True,
                container_count=len(containers),
                running_count=running,
                healthy_count=healthy,
                unhealthy_count=unhealthy,
                detail="Docker API reachable.",
            )
    except PermissionError:
        result = DockerAvailability(available=False, detail="Docker socket permission denied.")
    except (OSError, json.JSONDecodeError) as exc:
        result = DockerAvailability(available=False, detail=f"Docker unavailable: {exc}")

    with _CACHE_LOCK:
        _SUMMARY_CACHE = (monotonic(), result)
    return result


def restart_container(container_name: str, *, timeout_seconds: int = 10) -> tuple[bool, str]:
    try:
        status_code, _ = _request(
            "POST",
            f"/containers/{quote(container_name, safe='')}/restart?t={timeout_seconds}",
            timeout=max(timeout_seconds, 3),
        )
    except PermissionError:
        return False, "Docker socket permission denied."
    except OSError as exc:
        return False, f"Restart failed: {exc}"

    if 200 <= status_code < 300:
        get_docker_availability(force=True)
        return True, f"Restart request sent for {container_name}."
    return False, f"Docker API returned {status_code} while restarting {container_name}."
