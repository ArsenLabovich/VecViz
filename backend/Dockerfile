FROM python:3.13-slim

WORKDIR /app

# Install uv for fast dependency resolution
RUN pip install --no-cache-dir uv

# Copy dependency spec
COPY pyproject.toml .

# Install all dependencies
RUN uv pip install --system --no-cache -r pyproject.toml 2>/dev/null || \
    uv pip install --system --no-cache \
    fastapi uvicorn[standard] pydantic pydantic-settings \
    openai sentence-transformers umap-learn pacmap \
    scikit-learn numpy qdrant-client langchain-text-splitters \
    tiktoken pypdf tenacity python-multipart httpx

# Copy application code
COPY app/ ./app/

# Create models directory
RUN mkdir -p /app/models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
