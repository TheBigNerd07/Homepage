from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends, HTTPException

from app.db.session import get_db
from app.models import LabNode, ServiceLink
from app.schemas.node import NodeCreate, NodeSummaryRead, NodeUpdate
from app.services.nodes import build_node_summaries, ensure_local_node

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("", response_model=list[NodeSummaryRead])
def list_nodes_route(db: Session = Depends(get_db)) -> list[NodeSummaryRead]:
    ensure_local_node(db)
    return build_node_summaries(db)


@router.post("", response_model=NodeSummaryRead, status_code=201)
def create_node(payload: NodeCreate, db: Session = Depends(get_db)) -> NodeSummaryRead:
    if db.execute(select(LabNode).where(LabNode.name == payload.name.strip())).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A node with that name already exists.")
    if payload.is_local:
        current_local = db.execute(select(LabNode).where(LabNode.is_local.is_(True))).scalar_one_or_none()
        if current_local:
            current_local.is_local = False
            db.add(current_local)
    node = LabNode(
        name=payload.name.strip(),
        hostname=payload.hostname.strip(),
        role=payload.role.strip(),
        description=payload.description.strip(),
        status_endpoint=payload.status_endpoint or None,
        metrics_source=payload.metrics_source or None,
        tags=payload.tags,
        sort_order=db.query(LabNode).count() + 1,
        is_enabled=payload.is_enabled,
        is_local=payload.is_local,
    )
    db.add(node)
    db.commit()
    return next(item for item in build_node_summaries(db) if item.id == node.id)


@router.patch("/{node_id}", response_model=NodeSummaryRead)
def update_node(node_id: int, payload: NodeUpdate, db: Session = Depends(get_db)) -> NodeSummaryRead:
    node = db.get(LabNode, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found.")
    updates = payload.model_dump(exclude_unset=True)
    if "is_local" in updates and updates["is_local"] and not node.is_local:
        current_local = db.execute(select(LabNode).where(LabNode.is_local.is_(True))).scalar_one_or_none()
        if current_local and current_local.id != node.id:
            current_local.is_local = False
            db.add(current_local)
    for field, value in updates.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(node, field, value)
    db.add(node)
    db.commit()
    return next(item for item in build_node_summaries(db) if item.id == node.id)


@router.delete("/{node_id}", status_code=204)
def delete_node(node_id: int, db: Session = Depends(get_db)) -> None:
    node = db.get(LabNode, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found.")
    if node.is_local:
        raise HTTPException(status_code=400, detail="The local primary node cannot be deleted.")
    local_node = ensure_local_node(db)
    services = db.execute(select(ServiceLink).where(ServiceLink.node_id == node.id)).scalars().all()
    for service in services:
        service.node_id = local_node.id
        db.add(service)
    db.delete(node)
    db.commit()
