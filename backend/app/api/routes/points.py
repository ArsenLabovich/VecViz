from fastapi import APIRouter, Query, BackgroundTasks
from fastapi.responses import JSONResponse

from app.core.exceptions import CollectionNotFound, PointNotFound, ReductionNotReady
from app.models.schemas import (
    PointBrief, PointDetail, PointsResponse, RefitRequest,
)
from app.services import vector_db, reduction, clustering
from app.services.clustering import color_for_cluster
from app.api.routes.status import publish
import numpy as np

router = APIRouter()


@router.get("/collections/{name}/points", response_model=PointsResponse)
async def get_points(
    name: str,
    limit: int = Query(default=10000, ge=1, le=100000),
    offset: int = Query(default=0, ge=0),
    cluster_id: int | None = Query(default=None),
    document_id: str | None = Query(default=None),
):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    meta = await vector_db.get_meta(name)
    umap_ready = meta.get("umap_ready", False)
    total = await vector_db.count_points(name)

    raw = await vector_db.get_points_page(
        name, limit=limit, offset=offset,
        cluster_id=cluster_id, document_id=document_id,
    )

    points = [
        PointBrief(
            id=p["id"],
            x=p.get("x", 0.0),
            y=p.get("y", 0.0),
            z=p.get("z", 0.0),
            text_preview=p.get("text", "")[:200],
            label=p.get("label"),
            document_id=p.get("document_id", ""),
            filename=p.get("filename", ""),
            cluster_id=p.get("cluster_id"),
            cluster_label=p.get("cluster_label"),
            color=color_for_cluster(p.get("cluster_id", -1)),
        )
        for p in raw
    ]

    return PointsResponse(points=points, total=total, umap_ready=umap_ready)


@router.get("/collections/{name}/points/{point_id}", response_model=PointDetail)
async def get_point(name: str, point_id: str):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    p = await vector_db.get_point_by_id(name, point_id)
    if not p:
        raise PointNotFound(point_id)

    return PointDetail(
        id=p["id"],
        text=p.get("text", ""),
        x=p.get("x", 0.0),
        y=p.get("y", 0.0),
        z=p.get("z", 0.0),
        document_id=p.get("document_id", ""),
        filename=p.get("filename", ""),
        chunk_index=p.get("chunk_index", 0),
        token_count=p.get("token_count", 0),
        cluster_id=p.get("cluster_id"),
        cluster_label=p.get("cluster_label"),
        metadata=p.get("metadata", {}),
    )


@router.post("/collections/{name}/points/refit", status_code=202)
async def refit_layout(name: str, body: RefitRequest, background_tasks: BackgroundTasks):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    background_tasks.add_task(_refit_task, name, body)
    return JSONResponse(status_code=202, content={"status": "refit started"})


async def _refit_task(name: str, body: RefitRequest):
    try:
        await publish(name, "progress", {"stage": "reducing", "percent": 10, "message": "Fetching vectors"})
        all_ids, all_vectors = await vector_db.scroll_all_vectors(name)
        if len(all_ids) < 3:
            await publish(name, "error", {"message": "Not enough points to refit"})
            return

        await publish(name, "progress", {"stage": "reducing", "percent": 30, "message": f"Running {body.method.value.upper()} on {len(all_ids)} points"})
        updates = await reduction.fit_and_store(
            name, all_ids, all_vectors,
            n_neighbors=body.n_neighbors,
            min_dist=body.min_dist,
            method=body.method.value,
        )

        await publish(name, "progress", {"stage": "storing_coords", "percent": 75, "message": "Writing coordinates"})
        await vector_db.update_payloads_batch(name, updates)

        await publish(name, "progress", {"stage": "clustering", "percent": 88, "message": "Re-clustering"})
        coords = np.array([[u[1]["x"], u[1]["y"], u[1]["z"]] for u in updates], dtype=np.float32)
        labels, _ = clustering.cluster_points(coords)
        label_updates = [(pid, {"cluster_id": int(lbl)}) for pid, lbl in zip(all_ids, labels)]
        await vector_db.update_payloads_batch(name, label_updates)

        await vector_db.update_meta(name, {"umap_ready": True})
        await publish(name, "done", {"message": "Refit complete"})
    except Exception as e:
        await publish(name, "error", {"message": str(e)})
