"""UMAP / PaCMAP reduction service.

Architecture decisions:
- CPU-bound computation runs in ProcessPoolExecutor (never blocks event loop)
- Fitted model pickled to disk (survives backend restarts)
- Subsample strategy for N > 5000: fit on 20k sample, transform rest
- PCA fallback for N < 15 (UMAP needs ≥ n_neighbors points)
- All coords normalised to [-50, 50] scene units
"""
from __future__ import annotations

import asyncio
import logging
import os
import pickle
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from typing import Any

import numpy as np

from app.config import settings, ReductionMethod

logger = logging.getLogger("vecviz")

_executor = ProcessPoolExecutor(max_workers=2)

_SUBSAMPLE_THRESHOLD = 5_000
_SUBSAMPLE_SIZE = 20_000
_COORD_SCALE = 50.0


def _model_path(collection_name: str) -> Path:
    return Path(settings.models_dir) / collection_name / "reduction_model.pkl"


def _save_model(collection_name: str, model: Any) -> None:
    path = _model_path(collection_name)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(model, f)


def _load_model(collection_name: str) -> Any | None:
    path = _model_path(collection_name)
    if not path.exists():
        return None
    with open(path, "rb") as f:
        return pickle.load(f)


def _normalize(coords: np.ndarray) -> np.ndarray:
    """Normalise to [-50, 50] in each axis."""
    result = coords.astype(np.float32).copy()
    for i in range(result.shape[1]):
        col = result[:, i]
        lo, hi = col.min(), col.max()
        rng = hi - lo
        if rng > 1e-8:
            result[:, i] = (col - lo) / rng * (2 * _COORD_SCALE) - _COORD_SCALE
    return result


# ── Sync compute functions (run in ProcessPoolExecutor) ───────────────────────

def _fit_transform_umap(
    vectors: np.ndarray,
    n_neighbors: int,
    min_dist: float,
) -> tuple[np.ndarray, Any]:
    import umap

    model = umap.UMAP(
        n_components=3,
        n_neighbors=n_neighbors,
        min_dist=min_dist,
        metric="cosine",
        random_state=42,
        low_memory=True,
    )
    if len(vectors) > _SUBSAMPLE_THRESHOLD:
        logger.info("Subsampling %d vectors for UMAP fit", _SUBSAMPLE_SIZE)
        rng = np.random.default_rng(42)
        idx = rng.choice(len(vectors), size=min(_SUBSAMPLE_SIZE, len(vectors)), replace=False)
        model.fit(vectors[idx])
        coords = model.transform(vectors)
    else:
        coords = model.fit_transform(vectors)

    return coords.astype(np.float32), model


def _fit_transform_pacmap(
    vectors: np.ndarray,
    n_neighbors: int,
) -> tuple[np.ndarray, Any]:
    import pacmap

    model = pacmap.PaCMAP(
        n_components=3,
        n_neighbors=n_neighbors,
        random_state=42,
    )
    coords = model.fit_transform(vectors, init="pca")
    return coords.astype(np.float32), model


def _fit_transform_pca(vectors: np.ndarray) -> tuple[np.ndarray, Any]:
    from sklearn.decomposition import PCA

    model = PCA(n_components=min(3, vectors.shape[1]))
    coords = model.fit_transform(vectors)
    # Pad to 3 columns if fewer components
    if coords.shape[1] < 3:
        pad = np.zeros((len(coords), 3 - coords.shape[1]), dtype=np.float32)
        coords = np.hstack([coords, pad])
    return coords.astype(np.float32), model


def _compute_sync(
    vectors: np.ndarray,
    method: str,
    n_neighbors: int,
    min_dist: float,
) -> tuple[np.ndarray, Any]:
    n = len(vectors)
    if n < 4:
        # Trivial: place in a line
        coords = np.zeros((n, 3), dtype=np.float32)
        coords[:, 0] = np.arange(n, dtype=np.float32)
        return coords, None

    if n < 15:
        logger.info("N=%d < 15, falling back to PCA", n)
        return _fit_transform_pca(vectors)

    if method == "pacmap":
        return _fit_transform_pacmap(vectors, n_neighbors=min(n_neighbors, n - 1))

    return _fit_transform_umap(vectors, n_neighbors=min(n_neighbors, n - 1), min_dist=min_dist)


def _transform_sync(model: Any, vectors: np.ndarray) -> np.ndarray:
    """Project new vectors into existing space using fitted model."""
    if model is None:
        return np.zeros((len(vectors), 3), dtype=np.float32)
    try:
        coords = model.transform(vectors)
        return coords.astype(np.float32)
    except Exception as e:
        logger.warning("model.transform failed: %s — using zeros", e)
        return np.zeros((len(vectors), 3), dtype=np.float32)


# ── Async API ─────────────────────────────────────────────────────────────────

async def fit_and_store(
    collection_name: str,
    ids: list[str],
    vectors: np.ndarray,
    n_neighbors: int = 15,
    min_dist: float = 0.1,
    method: str | None = None,
) -> list[tuple[str, dict[str, Any]]]:
    """
    Fit reduction model, normalise coords, persist model.
    Returns list of (point_id, {x, y, z}) updates.
    """
    chosen_method = method or settings.reduction_method.value
    loop = asyncio.get_event_loop()

    logger.info(
        "Starting %s reduction on %d vectors (collection=%s)",
        chosen_method.upper(),
        len(vectors),
        collection_name,
    )

    coords, model = await loop.run_in_executor(
        _executor,
        _compute_sync,
        vectors,
        chosen_method,
        n_neighbors,
        min_dist,
    )

    coords = _normalize(coords)

    if model is not None:
        _save_model(collection_name, model)
        logger.info("Saved reduction model for collection '%s'", collection_name)

    updates = [
        (pid, {"x": float(c[0]), "y": float(c[1]), "z": float(c[2])})
        for pid, c in zip(ids, coords)
    ]
    return updates


async def transform_query(
    collection_name: str,
    query_vector: np.ndarray,
) -> np.ndarray:
    """Project a single query vector into the existing 3D space."""
    model = _load_model(collection_name)
    if model is None:
        return np.zeros((1, 3), dtype=np.float32)

    loop = asyncio.get_event_loop()
    coords = await loop.run_in_executor(
        _executor, _transform_sync, model, query_vector.reshape(1, -1)
    )
    return coords[0]


def model_exists(collection_name: str) -> bool:
    return _model_path(collection_name).exists()
