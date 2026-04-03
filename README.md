---
title: Vector DB Visualisation
emoji: 🔮
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Vector DB Visualisation

Upload documents and explore their vector embeddings in interactive 3D.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant Cloud API key |
| `USE_LOCAL_EMBEDDINGS` | `true` to use local model (no API key needed) |
| `OPENAI_API_KEY` | Required if `USE_LOCAL_EMBEDDINGS=false` |
