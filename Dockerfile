# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime (Python + nginx + supervisord)
FROM python:3.13-slim

# Install system deps: nginx, supervisor, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Install torch (CPU) first — large layer, changes rarely
RUN uv pip install --system --no-cache \
    torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining ML packages
RUN uv pip install --system --no-cache \
    "sentence-transformers>=5.3.0" \
    "umap-learn>=0.5.11" \
    numba \
    "scikit-learn>=1.8.0" \
    "numpy>=2.4.0" \
    scipy \
    "pacmap>=0.7.3"

# Install app dependencies
RUN uv pip install --system --no-cache \
    "fastapi>=0.135.0" \
    "uvicorn[standard]>=0.42.0" \
    "pydantic>=2.12.0" \
    "pydantic-settings>=2.9.0" \
    "openai>=2.30.0" \
    "qdrant-client>=1.17.0" \
    "langchain-text-splitters>=0.3.0" \
    "tiktoken>=0.12.0" \
    "pymupdf>=1.24.0" \
    "tenacity>=9.0.0" \
    "yake>=0.4.8" \
    "python-multipart>=0.0.22" \
    "httpx>=0.28.0"

# Copy backend app
WORKDIR /app
COPY backend/app ./app

# Copy built frontend
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# Configure nginx
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx/nginx.hf.conf /etc/nginx/conf.d/default.conf

# Configure supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 7860

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
