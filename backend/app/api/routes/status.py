"""SSE progress stream for long-running operations per collection."""
from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

# In-memory pub/sub: collection_name → list of queues
_subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)


async def publish(collection_name: str, event: str, data: dict) -> None:
    """Publish a progress event to all SSE subscribers of a collection."""
    payload = json.dumps({"event": event, "data": data})
    dead = []
    for q in _subscribers.get(collection_name, []):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _subscribers[collection_name].remove(q)


async def _sse_generator(collection_name: str) -> AsyncGenerator[str, None]:
    q: asyncio.Queue = asyncio.Queue(maxsize=64)
    _subscribers[collection_name].append(q)
    try:
        while True:
            try:
                message = await asyncio.wait_for(q.get(), timeout=25.0)
                yield f"data: {message}\n\n"
                if json.loads(message).get("event") in ("done", "error"):
                    break
            except asyncio.TimeoutError:
                yield ": ping\n\n"  # keep-alive
    finally:
        try:
            _subscribers[collection_name].remove(q)
        except ValueError:
            pass


@router.get("/collections/{name}/status")
async def collection_status(name: str):
    return StreamingResponse(
        _sse_generator(name),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
