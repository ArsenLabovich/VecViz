from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse

from app.core.exceptions import CollectionNotFound
from app.models.schemas import (
    ClustersResponse, ClusterInfo,
    ClusterRecomputeRequest, ClusterRecomputeResponse,
)
from app.services import vector_db, clustering, labeling
from app.services.clustering import build_cluster_info, color_for_cluster
from app.api.routes.status import publish
import numpy as np

router = APIRouter()


@router.get("/collections/{name}/clusters", response_model=ClustersResponse)
async def get_clusters(name: str):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    points = await vector_db.get_points_page(name, limit=100_000)
    if not points:
        return ClustersResponse(clusters=[])

    # Build cluster map from existing cluster_id in payloads
    cluster_map: dict[int, dict] = {}
    for p in points:
        cid = p.get("cluster_id", -1)
        if cid is None or cid < 0:
            continue
        if cid not in cluster_map:
            cluster_map[cid] = {
                "cluster_id": cid,
                "label": p.get("cluster_label"),
                "point_count": 0,
                "xs": [], "ys": [], "zs": [],
                "color": color_for_cluster(cid),
            }
        cluster_map[cid]["point_count"] += 1
        cluster_map[cid]["xs"].append(p.get("x", 0.0))
        cluster_map[cid]["ys"].append(p.get("y", 0.0))
        cluster_map[cid]["zs"].append(p.get("z", 0.0))

    clusters = [
        ClusterInfo(
            cluster_id=v["cluster_id"],
            label=v["label"],
            point_count=v["point_count"],
            centroid={
                "x": float(np.mean(v["xs"])),
                "y": float(np.mean(v["ys"])),
                "z": float(np.mean(v["zs"])),
            },
            color=v["color"],
        )
        for v in sorted(cluster_map.values(), key=lambda x: x["cluster_id"])
    ]

    return ClustersResponse(clusters=clusters)


@router.post("/collections/{name}/clusters/recompute", response_model=ClusterRecomputeResponse)
async def recompute_clusters(name: str, body: ClusterRecomputeRequest):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    points = await vector_db.get_points_page(name, limit=100_000)
    if len(points) < body.min_cluster_size * 2:
        return ClusterRecomputeResponse(cluster_count=0, noise_points=len(points))

    coords = np.array([[p.get("x", 0), p.get("y", 0), p.get("z", 0)] for p in points], dtype=np.float32)
    ids = [p["id"] for p in points]

    labels, n_clusters = clustering.cluster_points(
        coords,
        min_cluster_size=body.min_cluster_size,
        min_samples=body.min_samples,
    )

    updates = [(pid, {"cluster_id": int(lbl)}) for pid, lbl in zip(ids, labels)]
    await vector_db.update_payloads_batch(name, updates)

    noise = int((labels == -1).sum())
    return ClusterRecomputeResponse(cluster_count=n_clusters, noise_points=noise)


@router.post("/collections/{name}/clusters/{cluster_id}/label", status_code=202)
async def generate_cluster_label(
    name: str,
    cluster_id: int,
    background_tasks: BackgroundTasks,
):
    if not await vector_db.collection_exists(name):
        raise CollectionNotFound(name)

    background_tasks.add_task(_label_task, name, cluster_id)
    return JSONResponse(status_code=202, content={"status": "labeling started"})


async def _label_task(name: str, cluster_id: int):
    points = await vector_db.get_points_page(name, limit=100_000, cluster_id=cluster_id)
    texts = [p.get("text", "") for p in points[:10]]
    label = await labeling.generate_label(texts)

    updates = [(p["id"], {"cluster_label": label}) for p in points]
    await vector_db.update_payloads_batch(name, updates)
