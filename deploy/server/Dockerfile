FROM python:3.11-slim

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/models

# CPU-only torch first so hindsight doesn't pull the multi-GB CUDA wheel
RUN pip install uv \
    && uv pip install --system torch --index-url https://download.pytorch.org/whl/cpu \
    && uv pip install --system "hindsight-all==0.4.20" "hindsight-api==0.4.18"

# Pre-download the two local models (server has direct huggingface.co access)
RUN python -c "from huggingface_hub import snapshot_download; \
    snapshot_download('BAAI/bge-m3'); \
    snapshot_download('cross-encoder/ms-marco-MiniLM-L-6-v2')"

WORKDIR /app
COPY serve.py dashboard_server.py dashboard.html /app/
COPY tiktoken_cache /app/tiktoken_cache
