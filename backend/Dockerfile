FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

# ── Heavy ML deps (cached as long as these versions don't change) ─────────────
RUN uv pip install --system --no-cache \
    torch --index-url https://download.pytorch.org/whl/cpu
RUN uv pip install --system --no-cache \
    sentence-transformers>=5.3.0 \
    umap-learn>=0.5.11 \
    numba \
    scikit-learn>=1.8.0 \
    numpy>=2.4.0 \
    scipy \
    pacmap>=0.7.3

# ── Light app deps (reinstalled when pyproject.toml changes) ─────────────────
COPY pyproject.toml .
RUN uv pip install --system --no-cache \
    fastapi>=0.135.0 \
    "uvicorn[standard]>=0.42.0" \
    pydantic>=2.12.0 \
    pydantic-settings>=2.9.0 \
    openai>=2.30.0 \
    qdrant-client>=1.17.0 \
    langchain-text-splitters>=0.3.0 \
    tiktoken>=0.12.0 \
    pymupdf>=1.24.0 \
    tenacity>=9.0.0 \
    yake>=0.4.8 \
    python-multipart>=0.0.22 \
    httpx>=0.28.0

# ── Application code ──────────────────────────────────────────────────────────
COPY app/ ./app/

RUN mkdir -p /app/models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
