import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.router import router
from app.config import settings
from app.core.middleware import log_requests

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vecviz")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure models directory exists
    os.makedirs(settings.models_dir, exist_ok=True)
    logger.info("VecViz backend starting — models dir: %s", settings.models_dir)
    logger.info(
        "Embedding: %s | Reduction: %s",
        "local" if settings.use_local_embeddings else settings.embedding_model.value,
        settings.reduction_method.value,
    )
    yield
    logger.info("VecViz backend shutting down")


app = FastAPI(
    title="VecViz API",
    description="3D Vector Database Visualizer",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.middleware("http")(log_requests)

app.include_router(router)
