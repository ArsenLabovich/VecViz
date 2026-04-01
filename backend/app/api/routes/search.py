from fastapi import APIRouter
from app.core.exceptions import CollectionNotFound, ReductionNotReady
from app.models.schemas import SearchRequest, SearchResponse, SearchResultItem
from app.services import vector_db, reduction
from app.api.deps import get_embedder_dep
from fastapi import Depends
from app.services.embedding import BaseEmbedder
import numpy as np

router = APIRouter()


@router.post("/collections/{name}/search", response_model=SearchResponse)
async def search(
    name: str,
    body: SearchRequest,
    embedder: BaseEmbedder = Depends(get_embedder_dep),
):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    if not reduction.model_exists(name):
        raise ReductionNotReady(name)

    # Embed query
    query_vec = await embedder.embed([body.query])
    query_vec = query_vec[0]  # shape (D,)

    # Vector search in Qdrant
    hits = await vector_db.search_vectors(name, query_vec, k=body.k)

    # Project query into 3D space
    query_3d = await reduction.transform_query(name, query_vec)

    results = [
        SearchResultItem(
            id=h["id"],
            x=h.get("x", 0.0),
            y=h.get("y", 0.0),
            z=h.get("z", 0.0),
            text_preview=h.get("text", "")[:200],
            score=round(float(h["score"]), 4),
        )
        for h in hits
    ]

    return SearchResponse(
        query_point={"x": float(query_3d[0]), "y": float(query_3d[1]), "z": float(query_3d[2])},
        results=results,
    )
