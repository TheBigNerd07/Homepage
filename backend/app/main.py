from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.core.auth import require_authenticated_request
from app.core.config import get_settings
from app.db.bootstrap import run_migrations
from app.routers.actions import router as actions_router
from app.routers.auth import router as auth_router
from app.routers.backups import router as backups_router
from app.routers.dashboard import router as dashboard_router
from app.routers.diagnostics import router as diagnostics_router
from app.routers.health import router as health_router
from app.routers.quick_actions import router as quick_actions_router
from app.routers.reminders import router as reminders_router
from app.routers.scripture import router as scripture_router
from app.routers.services import router as services_router
from app.routers.settings import router as settings_router
from app.services.service_health import service_health_monitor

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    run_migrations()
    await service_health_monitor.start()
    try:
        yield
    finally:
        await service_health_monitor.stop()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

if settings.behind_proxy:
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if "*" not in settings.trusted_host_list:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_host_list)

protected_dependencies = [Depends(require_authenticated_request)]

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(dashboard_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(settings_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(services_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(quick_actions_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(actions_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(backups_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(diagnostics_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(reminders_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
app.include_router(scripture_router, prefix=settings.api_prefix, dependencies=protected_dependencies)
