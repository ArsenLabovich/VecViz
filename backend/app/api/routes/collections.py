from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.schemas import (
    CollectionCreate,
    CollectionInfo,
    CollectionListResponse,
)
from app.services import vector_db
from app.services.embedding import get_embedder
from app.core.exceptions import CollectionNotFound, CollectionAlreadyExists

router = APIRouter(prefix="/collections")


@router.get("", response_model=CollectionListResponse)
async def list_collections():
    cols = await vector_db.list_collections()
    items = [CollectionInfo(**c) for c in cols]
    return CollectionListResponse(collections=items)


@router.post("", response_model=CollectionInfo, status_code=201)
async def create_collection(body: CollectionCreate):
    if await vector_db.collection_exists(body.name):
        raise CollectionAlreadyExists(body.name)

    embedder = get_embedder()
    now = datetime.now(timezone.utc).isoformat()

    await vector_db.create_collection(
        name=body.name,
        description=body.description,
        reduction_method=body.reduction_method.value,
        vector_size=embedder.dim,
        created_at=now,
    )

    return CollectionInfo(
        name=body.name,
        description=body.description,
        point_count=0,
        document_count=0,
        reduction_method=body.reduction_method,
        umap_ready=False,
        created_at=now,
    )


@router.delete("/{name}", status_code=204)
async def delete_collection(name: str):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)
    await vector_db.delete_collection(name)
