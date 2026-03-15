from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from fastapi import APIRouter, Depends, HTTPException

from app.db.session import get_db
from app.models import LabNode, ServiceLink
from app.schemas.service import ServiceCreate, ServiceRead, ServiceReorderRequest, ServiceUpdate
from app.services.service_health import apply_manual_service_status
from app.services.service_links import service_to_read

router = APIRouter(prefix="/services", tags=["services"])


def _validate_node(db: Session, node_id: int | None) -> None:
    if node_id is None:
        return
    if db.get(LabNode, node_id) is None:
        raise HTTPException(status_code=400, detail="Selected node does not exist.")


@router.get("", response_model=list[ServiceRead])
def list_services(db: Session = Depends(get_db)) -> list[ServiceRead]:
    services = (
        db.execute(
            select(ServiceLink)
            .options(joinedload(ServiceLink.node))
            .order_by(ServiceLink.sort_order.asc(), ServiceLink.name.asc())
        )
        .scalars()
        .all()
    )
    return [service_to_read(service) for service in services]


@router.post("", response_model=ServiceRead, status_code=201)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)) -> ServiceRead:
    _validate_node(db, payload.node_id)
    service = ServiceLink(
        **payload.model_dump(),
        status=payload.manual_status,
        sort_order=db.query(ServiceLink).count() + 1,
    )
    apply_manual_service_status(service)
    db.add(service)
    db.commit()
    service = db.execute(
        select(ServiceLink).options(joinedload(ServiceLink.node)).where(ServiceLink.id == service.id)
    ).scalar_one()
    return service_to_read(service)


@router.patch("/{service_id}", response_model=ServiceRead)
def update_service(service_id: int, payload: ServiceUpdate, db: Session = Depends(get_db)) -> ServiceRead:
    service = db.get(ServiceLink, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found.")
    updates = payload.model_dump(exclude_unset=True)
    _validate_node(db, updates.get("node_id"))
    for field, value in updates.items():
        setattr(service, field, value)
    apply_manual_service_status(service)
    db.add(service)
    db.commit()
    service = db.execute(
        select(ServiceLink).options(joinedload(ServiceLink.node)).where(ServiceLink.id == service.id)
    ).scalar_one()
    return service_to_read(service)


@router.put("/reorder", response_model=list[ServiceRead])
def reorder_services(payload: ServiceReorderRequest, db: Session = Depends(get_db)) -> list[ServiceRead]:
    services = (
        db.execute(select(ServiceLink).where(ServiceLink.id.in_(payload.ordered_ids)))
        .scalars()
        .all()
    )
    service_map = {service.id: service for service in services}
    if len(service_map) != len(payload.ordered_ids):
        raise HTTPException(status_code=400, detail="One or more services were not found.")

    for index, service_id in enumerate(payload.ordered_ids, start=1):
        service_map[service_id].sort_order = index
        db.add(service_map[service_id])
    db.commit()
    refreshed = (
        db.execute(
            select(ServiceLink)
            .options(joinedload(ServiceLink.node))
            .where(ServiceLink.id.in_(payload.ordered_ids))
        )
        .scalars()
        .all()
    )
    refreshed_map = {service.id: service for service in refreshed}
    return [service_to_read(refreshed_map[service_id]) for service_id in payload.ordered_ids]


@router.delete("/{service_id}", status_code=204)
def delete_service(service_id: int, db: Session = Depends(get_db)) -> None:
    service = db.get(ServiceLink, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found.")
    db.delete(service)
    db.commit()
