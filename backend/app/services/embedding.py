"""Embedding service — strategy pattern: OpenAI | sentence-transformers.

OpenAI calls use tenacity for rate-limit retry with exponential backoff.
All outputs are float32 numpy arrays.
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod

import numpy as np
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import settings

logger = logging.getLogger("vecviz")

_OPENAI_BATCH_SIZE = 100  # max texts per API call
_LOCAL_BATCH_SIZE = 32


class BaseEmbedder(ABC):
    @property
    @abstractmethod
    def dim(self) -> int: ...

    @abstractmethod
    async def embed(self, texts: list[str]) -> np.ndarray: ...


# ── OpenAI ────────────────────────────────────────────────────────────────────

class OpenAIEmbedder(BaseEmbedder):
    def __init__(self) -> None:
        from openai import AsyncOpenAI, RateLimitError

        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.embedding_model.value
        self._RateLimitError = RateLimitError

    @property
    def dim(self) -> int:
        return settings.embedding_dim

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=60),
        stop=stop_after_attempt(6),
        retry=retry_if_exception_type(Exception),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def _call_api(self, batch: list[str]) -> list[list[float]]:
        response = await self._client.embeddings.create(
            model=self._model,
            input=batch,
            encoding_format="float",
        )
        return [item.embedding for item in response.data]

    async def embed(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dim), dtype=np.float32)

        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), _OPENAI_BATCH_SIZE):
            batch = texts[i : i + _OPENAI_BATCH_SIZE]
            logger.debug("Embedding batch %d/%d", i // _OPENAI_BATCH_SIZE + 1, -(-len(texts) // _OPENAI_BATCH_SIZE))
            embeddings = await self._call_api(batch)
            all_embeddings.extend(embeddings)

        return np.array(all_embeddings, dtype=np.float32)


# ── Local (sentence-transformers) ─────────────────────────────────────────────

class LocalEmbedder(BaseEmbedder):
    _model_instance = None  # lazy singleton

    def __init__(self) -> None:
        self._model_name = "all-MiniLM-L6-v2"

    def _load(self):
        if LocalEmbedder._model_instance is None:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading local embedding model: %s", self._model_name)
            LocalEmbedder._model_instance = SentenceTransformer(self._model_name)
        return LocalEmbedder._model_instance

    @property
    def dim(self) -> int:
        return 384

    async def embed(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dim), dtype=np.float32)

        import asyncio

        model = self._load()
        loop = asyncio.get_event_loop()

        def _encode():
            return model.encode(
                texts,
                batch_size=_LOCAL_BATCH_SIZE,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True,
            )

        result = await loop.run_in_executor(None, _encode)
        return result.astype(np.float32)


# ── Factory ───────────────────────────────────────────────────────────────────

_embedder_instance: BaseEmbedder | None = None


def get_embedder() -> BaseEmbedder:
    global _embedder_instance
    if _embedder_instance is None:
        if settings.use_local_embeddings:
            _embedder_instance = LocalEmbedder()
            logger.info("Using local embedder (sentence-transformers)")
        else:
            _embedder_instance = OpenAIEmbedder()
            logger.info("Using OpenAI embedder: %s", settings.embedding_model.value)
    return _embedder_instance
