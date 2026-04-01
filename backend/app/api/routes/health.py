from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services import vector_db
from app.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    try:
        qdrant_ok = await vector_db.health_check()
        qdrant_status = "connected" if qdrant_ok else "error"
    except Exception:
        qdrant_status = "unreachable"

    model = "local:all-MiniLM-L6-v2" if settings.use_local_embeddings else settings.embedding_model.value

    return HealthResponse(
        status="ok",
        qdrant=qdrant_status,
        embedding_model=model,
        reduction_method=settings.reduction_method.value,
    )
