from fastapi import APIRouter
from app.api.routes import health, collections, documents, points, search, clusters, status

router = APIRouter(prefix="/api")

router.include_router(health.router)
router.include_router(collections.router)
router.include_router(documents.router)
router.include_router(points.router)
router.include_router(search.router)
router.include_router(clusters.router)
router.include_router(status.router)
