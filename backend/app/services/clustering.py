"""HDBSCAN clustering using sklearn.cluster.HDBSCAN (built-in since 1.3).
Assigns cluster_id to each point. -1 = noise/unclustered.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np

logger = logging.getLogger("vecviz")

# Colour palette for clusters (cycles if more than len)
_PALETTE = [
    "#4f8ef7", "#f7a44f", "#4ff7a4", "#f74f8e", "#a44ff7",
    "#f7f74f", "#4ff7f7", "#f74f4f", "#4fa4f7", "#f7a4f7",
    "#a4f74f", "#f7a44f", "#4ff74f", "#a44ff7", "#f74fa4",
    "#4ff7a4", "#f74ff7", "#4fa4f7", "#a4f7f7", "#f7f7a4",
]


def cluster_points(
    coords: np.ndarray,  # (N, 3)
    min_cluster_size: int = 5,
    min_samples: int = 3,
) -> tuple[np.ndarray, int]:
    """
    Returns (labels array, n_clusters).
    labels[i] = cluster_id (int >= 0) or -1 for noise.
    """
    from sklearn.cluster import HDBSCAN

    if len(coords) < min_cluster_size * 2:
        logger.info("Too few points (%d) for clustering", len(coords))
        return np.full(len(coords), -1, dtype=np.int32), 0

    model = HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=min_samples,
        cluster_selection_method="eom",
    )
    labels = model.fit_predict(coords).astype(np.int32)
    n_clusters = int(labels.max()) + 1
    logger.info("HDBSCAN found %d clusters (%d noise)", n_clusters, (labels == -1).sum())
    return labels, n_clusters


def build_cluster_info(
    ids: list[str],
    coords: np.ndarray,
    labels: np.ndarray,
) -> list[dict[str, Any]]:
    """Compute per-cluster centroid and colour."""
    unique = sorted(set(labels.tolist()))
    result = []
    for cid in unique:
        if cid == -1:
            continue
        mask = labels == cid
        cluster_coords = coords[mask]
        centroid = cluster_coords.mean(axis=0)
        color = _PALETTE[cid % len(_PALETTE)]
        result.append(
            {
                "cluster_id": int(cid),
                "label": None,
                "point_count": int(mask.sum()),
                "centroid": {
                    "x": float(centroid[0]),
                    "y": float(centroid[1]),
                    "z": float(centroid[2]),
                },
                "color": color,
            }
        )
    return result


def color_for_cluster(cluster_id: int) -> str:
    if cluster_id < 0:
        return "#888888"
    return _PALETTE[cluster_id % len(_PALETTE)]
