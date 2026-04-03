"""Qdrant abstraction layer. All vectors stored as float32."""
from __future__ import annotations

import uuid
import logging
from typing import Any

import numpy as np
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

from app.config import settings

logger = logging.getLogger("vecviz")

META_COLLECTION = "_vecviz_meta"

_qdrant_client: AsyncQdrantClient | None = None


def _client() -> AsyncQdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = AsyncQdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
    return _qdrant_client


async def health_check() -> bool:
    info = await _client().get_collections()
    return info is not None


# ── Collection helpers ────────────────────────────────────────────────────────

async def ensure_meta_collection(client: AsyncQdrantClient) -> None:
    existing = {c.name for c in (await client.get_collections()).collections}
    if META_COLLECTION not in existing:
        await client.create_collection(
            META_COLLECTION,
            vectors_config=VectorParams(size=1, distance=Distance.COSINE),
        )


async def list_collections() -> list[dict[str, Any]]:
    client = _client()
    await ensure_meta_collection(client)
    result = await client.get_collections()
    names = [c.name for c in result.collections if not c.name.startswith("_")]
    out = []
    for name in names:
        info = await client.get_collection(name)
        meta = await _get_meta(client, name)
        out.append(
            {
                "name": name,
                "description": meta.get("description", ""),
                "point_count": info.points_count or 0,
                "document_count": meta.get("document_count", 0),
                "reduction_method": meta.get("reduction_method", "umap"),
                "umap_ready": meta.get("umap_ready", False),
                "created_at": meta.get("created_at", ""),
            }
        )
    return out


async def create_collection(
    name: str,
    description: str,
    reduction_method: str,
    vector_size: int,
    created_at: str,
) -> None:
    client = _client()
    await client.create_collection(
        name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
    await ensure_meta_collection(client)
    await _set_meta(
        client,
        name,
        {
            "description": description,
            "reduction_method": reduction_method,
            "vector_size": vector_size,
            "document_count": 0,
            "umap_ready": False,
            "created_at": created_at,
        },
    )


async def delete_collection(name: str) -> None:
    client = _client()
    await client.delete_collection(name)
    await client.delete(
        META_COLLECTION,
        points_selector=Filter(
            must=[FieldCondition(key="collection_name", match=MatchValue(value=name))]
        ),
    )


async def collection_exists(name: str) -> bool:
    client = _client()
    existing = {c.name for c in (await client.get_collections()).collections}
    return name in existing


# ── Meta helpers ──────────────────────────────────────────────────────────────

async def _get_meta(client: AsyncQdrantClient, collection_name: str) -> dict[str, Any]:
    result, _ = await client.scroll(
        META_COLLECTION,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="collection_name", match=MatchValue(value=collection_name)
                )
            ]
        ),
        limit=1,
        with_payload=True,
        with_vectors=False,
    )
    if result:
        return result[0].payload or {}
    return {}


async def _set_meta(
    client: AsyncQdrantClient, collection_name: str, data: dict[str, Any]
) -> None:
    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"meta:{collection_name}"))
    await client.upsert(
        META_COLLECTION,
        points=[
            PointStruct(
                id=point_id,
                vector=[0.0],
                payload={"collection_name": collection_name, **data},
            )
        ],
    )


async def update_meta(collection_name: str, updates: dict[str, Any]) -> None:
    client = _client()
    await ensure_meta_collection(client)
    existing = await _get_meta(client, collection_name)
    merged = {**existing, **updates}
    await _set_meta(client, collection_name, merged)


async def get_meta(collection_name: str) -> dict[str, Any]:
    client = _client()
    return await _get_meta(client, collection_name)


# ── Points CRUD ───────────────────────────────────────────────────────────────

async def upsert_points(
    collection_name: str,
    vectors: np.ndarray,
    payloads: list[dict[str, Any]],
    ids: list[str] | None = None,
) -> list[str]:
    if ids is None:
        ids = [str(uuid.uuid4()) for _ in range(len(vectors))]

    points = [
        PointStruct(
            id=pid,
            vector=vec.astype(np.float32).tolist(),
            payload=payload,
        )
        for pid, vec, payload in zip(ids, vectors, payloads)
    ]

    client = _client()
    await client.upsert(collection_name, points=points)
    return ids


async def scroll_all_vectors(
    collection_name: str,
    batch_size: int = 100,
) -> tuple[list[str], np.ndarray]:
    """Fetch all vectors from a collection. Returns (ids, vectors float32)."""
    ids: list[str] = []
    vectors: list[list[float]] = []
    offset = None
    client = _client()

    while True:
        result, next_offset = await client.scroll(
            collection_name,
            limit=batch_size,
            offset=offset,
            with_vectors=True,
            with_payload=False,
        )
        for point in result:
            ids.append(str(point.id))
            vectors.append(point.vector)  # type: ignore[arg-type]

        if next_offset is None:
            break
        offset = next_offset

    arr = np.array(vectors, dtype=np.float32) if vectors else np.empty((0, 0), dtype=np.float32)
    return ids, arr


async def update_payloads_batch(
    collection_name: str,
    updates: list[tuple[str, dict[str, Any]]],
    batch_size: int = 256,
) -> None:
    client = _client()
    for i in range(0, len(updates), batch_size):
        batch = updates[i : i + batch_size]
        for point_id, patch in batch:
            await client.set_payload(
                collection_name,
                payload=patch,
                points=[point_id],
            )


async def get_points_page(
    collection_name: str,
    limit: int = 10000,
    offset: int = 0,
    cluster_id: int | None = None,
    document_id: str | None = None,
) -> list[dict[str, Any]]:
    filters = []
    if cluster_id is not None:
        filters.append(FieldCondition(key="cluster_id", match=MatchValue(value=cluster_id)))
    if document_id is not None:
        filters.append(FieldCondition(key="document_id", match=MatchValue(value=document_id)))

    scroll_filter = Filter(must=filters) if filters else None
    client = _client()

    result, _ = await client.scroll(
        collection_name,
        scroll_filter=scroll_filter,
        limit=limit,
        offset=offset,
        with_payload=True,
        with_vectors=False,
    )
    return [{"id": str(p.id), **(p.payload or {})} for p in result]


async def get_point_by_id(collection_name: str, point_id: str) -> dict[str, Any] | None:
    client = _client()
    result = await client.retrieve(
        collection_name,
        ids=[point_id],
        with_payload=True,
        with_vectors=False,
    )
    if result:
        return {"id": str(result[0].id), **(result[0].payload or {})}
    return None


async def search_vectors(
    collection_name: str,
    query_vector: np.ndarray,
    k: int = 10,
) -> list[dict[str, Any]]:
    client = _client()
    result = await client.query_points(
        collection_name=collection_name,
        query=query_vector.astype(np.float32).tolist(),
        limit=k,
        with_payload=True,
    )
    return [{"id": str(h.id), "score": h.score, **(h.payload or {})} for h in result.points]


async def count_points(collection_name: str) -> int:
    client = _client()
    info = await client.get_collection(collection_name)
    return info.points_count or 0


async def get_documents_in_collection(collection_name: str) -> list[dict[str, Any]]:
    """Return distinct documents (by document_id) with chunk counts."""
    all_points = await get_points_page(collection_name, limit=100_000)
    docs: dict[str, dict[str, Any]] = {}
    for p in all_points:
        doc_id = p.get("document_id", "")
        if doc_id not in docs:
            docs[doc_id] = {
                "document_id": doc_id,
                "filename": p.get("filename", ""),
                "chunk_count": 0,
                "created_at": p.get("created_at", ""),
            }
        docs[doc_id]["chunk_count"] += 1
    return list(docs.values())
