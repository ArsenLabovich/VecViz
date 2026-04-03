from pydantic import BaseModel, Field
from typing import Any
from app.config import ReductionMethod


# ── Collections ──────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_\-]+$")
    description: str = Field(default="")
    reduction_method: ReductionMethod = ReductionMethod.UMAP


class CollectionInfo(BaseModel):
    name: str
    description: str
    point_count: int
    document_count: int
    reduction_method: ReductionMethod
    umap_ready: bool
    created_at: str


class CollectionListResponse(BaseModel):
    collections: list[CollectionInfo]


# ── Documents ─────────────────────────────────────────────────────────────────

class TextIngest(BaseModel):
    text: str = Field(..., min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)
    chunk_size: int = Field(default=512, ge=64, le=2048)
    chunk_overlap: int = Field(default=50, ge=0, le=512)


class IngestResponse(BaseModel):
    document_id: str
    filename: str
    chunks_created: int
    embeddings_generated: int
    processing_time_ms: float


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    chunk_count: int
    created_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo]


# ── Points ────────────────────────────────────────────────────────────────────

class PointBrief(BaseModel):
    id: str
    x: float
    y: float
    z: float
    text_preview: str
    label: str | None = None
    document_id: str
    filename: str
    cluster_id: int | None = None
    cluster_label: str | None = None
    color: str = "#4f8ef7"


class PointDetail(BaseModel):
    id: str
    text: str
    x: float
    y: float
    z: float
    document_id: str
    filename: str
    chunk_index: int
    token_count: int
    cluster_id: int | None = None
    cluster_label: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class PointsResponse(BaseModel):
    points: list[PointBrief]
    total: int
    umap_ready: bool


class RefitRequest(BaseModel):
    n_neighbors: int = Field(default=15, ge=5, le=100)
    min_dist: float = Field(default=0.1, ge=0.0, le=1.0)
    method: ReductionMethod = ReductionMethod.UMAP


# ── Search ────────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    k: int = Field(default=50, ge=1, le=500)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)


class SearchResultItem(BaseModel):
    id: str
    x: float
    y: float
    z: float
    text_preview: str
    score: float


class SearchResponse(BaseModel):
    query_point: dict[str, float]  # {x, y, z}
    results: list[SearchResultItem]


# ── Clusters ──────────────────────────────────────────────────────────────────

class ClusterInfo(BaseModel):
    cluster_id: int
    label: str | None = None
    point_count: int
    centroid: dict[str, float]
    color: str


class ClustersResponse(BaseModel):
    clusters: list[ClusterInfo]


class ClusterRecomputeRequest(BaseModel):
    min_cluster_size: int = Field(default=5, ge=2, le=500)
    min_samples: int = Field(default=3, ge=1, le=100)


class ClusterRecomputeResponse(BaseModel):
    cluster_count: int
    noise_points: int


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    qdrant: str
    embedding_model: str
    reduction_method: str
