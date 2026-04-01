"""Document upload and ingest pipeline.
Returns 202 immediately; progress streamed via SSE (/collections/{name}/status).
"""
from __future__ import annotations

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse

from app.api.deps import get_embedder_dep
from app.core.exceptions import CollectionNotFound, UnsupportedFileType
from app.models.schemas import DocumentListResponse, DocumentInfo, IngestResponse
from app.services import vector_db, reduction, clustering
from app.services.chunking import chunk_document
from app.services.embedding import BaseEmbedder
from app.api.routes.status import publish

logger = logging.getLogger("vecviz")

SUPPORTED_EXT = {".txt", ".md", ".pdf"}

router = APIRouter()


async def _ingest_pipeline(
    collection_name: str,
    content: bytes,
    filename: str,
    chunk_size: int,
    chunk_overlap: int,
    embedder: BaseEmbedder,
    document_id: str,
) -> IngestResponse:
    start = time.perf_counter()

    await publish(collection_name, "progress", {"stage": "chunking", "percent": 5, "message": "Splitting text into chunks"})

    chunks = chunk_document(content, filename, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    if not chunks:
        await publish(collection_name, "error", {"message": "No chunks extracted from document"})
        raise ValueError("No chunks extracted")

    await publish(collection_name, "progress", {"stage": "embedding", "percent": 20, "message": f"Generating embeddings for {len(chunks)} chunks"})

    texts = [c.text for c in chunks]
    vectors = await embedder.embed(texts)

    now = datetime.now(timezone.utc).isoformat()
    payloads = [
        {
            "text": c.text,
            "document_id": document_id,
            "filename": filename,
            "chunk_index": c.chunk_index,
            "char_start": c.char_start,
            "char_end": c.char_end,
            "token_count": c.token_count,
            "created_at": now,
            "metadata": c.metadata,
            # 3D coords and cluster will be filled after UMAP
            "x": 0.0,
            "y": 0.0,
            "z": 0.0,
            "cluster_id": -1,
            "cluster_label": None,
        }
        for c in chunks
    ]

    await publish(collection_name, "progress", {"stage": "storing", "percent": 50, "message": "Storing vectors in Qdrant"})
    point_ids = await vector_db.upsert_points(collection_name, vectors, payloads)

    # Update document count in meta
    meta = await vector_db.get_meta(collection_name)
    doc_count = meta.get("document_count", 0) + 1
    await vector_db.update_meta(collection_name, {"document_count": doc_count})

    # Fetch ALL vectors and run UMAP
    await publish(collection_name, "progress", {"stage": "reducing", "percent": 60, "message": "Computing 3D layout (UMAP)"})
    all_ids, all_vectors = await vector_db.scroll_all_vectors(collection_name)

    if len(all_ids) >= 3:
        updates = await reduction.fit_and_store(collection_name, all_ids, all_vectors)

        await publish(collection_name, "progress", {"stage": "storing_coords", "percent": 80, "message": "Writing 3D coordinates"})
        await vector_db.update_payloads_batch(collection_name, updates)

        # Clustering on 3D coords
        await publish(collection_name, "progress", {"stage": "clustering", "percent": 90, "message": "Detecting clusters"})
        import numpy as np
        coords = np.array([[u[1]["x"], u[1]["y"], u[1]["z"]] for u in updates], dtype=np.float32)
        labels, n_clusters = clustering.cluster_points(coords)
        label_updates = [(pid, {"cluster_id": int(lbl)}) for pid, lbl in zip(all_ids, labels)]
        await vector_db.update_payloads_batch(collection_name, label_updates)

        await vector_db.update_meta(collection_name, {"umap_ready": True})

    elapsed_ms = (time.perf_counter() - start) * 1000
    await publish(collection_name, "done", {
        "document_id": document_id,
        "chunks_created": len(chunks),
        "processing_time_ms": round(elapsed_ms, 1),
    })

    return IngestResponse(
        document_id=document_id,
        filename=filename,
        chunks_created=len(chunks),
        embeddings_generated=len(chunks),
        processing_time_ms=round(elapsed_ms, 1),
    )


@router.post("/collections/{name}/documents", status_code=202)
async def upload_document(
    name: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    chunk_size: int = Form(default=512),
    chunk_overlap: int = Form(default=50),
    embedder: BaseEmbedder = Depends(get_embedder_dep),
):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    filename = file.filename or "upload.txt"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in SUPPORTED_EXT:
        raise UnsupportedFileType(filename)

    content = await file.read()
    document_id = str(uuid.uuid4())

    background_tasks.add_task(
        _run_ingest,
        name,
        content,
        filename,
        chunk_size,
        chunk_overlap,
        embedder,
        document_id,
    )

    return JSONResponse(
        status_code=202,
        content={"document_id": document_id, "status": "processing"},
    )


async def _run_ingest(
    collection_name, content, filename, chunk_size, chunk_overlap, embedder, document_id
):
    try:
        await _ingest_pipeline(
            collection_name, content, filename, chunk_size, chunk_overlap, embedder, document_id
        )
    except Exception as e:
        logger.exception("Ingest failed: %s", e)
        await publish(collection_name, "error", {"message": str(e)})


@router.post("/collections/{name}/text", status_code=202)
async def ingest_text(
    name: str,
    background_tasks: BackgroundTasks,
    body: dict,
    embedder: BaseEmbedder = Depends(get_embedder_dep),
):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    text = body.get("text", "")
    if not text:
        return JSONResponse(status_code=422, content={"detail": "text is required"})

    document_id = str(uuid.uuid4())
    content = text.encode("utf-8")
    chunk_size = body.get("chunk_size", 512)
    chunk_overlap = body.get("chunk_overlap", 50)

    background_tasks.add_task(
        _run_ingest,
        name,
        content,
        "text_input.txt",
        chunk_size,
        chunk_overlap,
        embedder,
        document_id,
    )
    return JSONResponse(
        status_code=202,
        content={"document_id": document_id, "status": "processing"},
    )


@router.get("/collections/{name}/documents", response_model=DocumentListResponse)
async def list_documents(name: str):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)
    docs = await vector_db.get_documents_in_collection(name)
    return DocumentListResponse(
        documents=[DocumentInfo(**d) for d in docs]
    )
