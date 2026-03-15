#!/bin/bash
# ============================================================
# MemoMind Installer - One-script setup for WSL2 Ubuntu
# Run inside WSL2: bash install.sh
# ============================================================

set -e

echo "========================================="
echo "  MemoMind - Local Agent Memory System"
echo "========================================="
echo ""

# Check not root for final run, but need root for setup
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash install.sh"
    exit 1
fi

# 1. Install system dependencies
echo "[1/6] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3-pip python3-venv socat curl

# 2. Install uv (fast Python package manager)
echo "[2/6] Installing uv..."
if ! command -v /root/.local/bin/uv &>/dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH=$HOME/.local/bin:$PATH

# 3. Create venv and install hindsight
echo "[3/6] Creating Python environment and installing Hindsight..."
uv venv /opt/hindsight-env
uv pip install --python /opt/hindsight-env/bin/python3 hindsight-all hindsight-api

# 4. Create hindsight user
echo "[4/6] Creating hindsight user..."
id hindsight 2>/dev/null || useradd -m -s /bin/bash hindsight
chown -R hindsight:hindsight /opt/hindsight-env

# 5. Download embedding models (via China mirror)
echo "[5/6] Downloading embedding models..."
export HF_ENDPOINT=https://hf-mirror.com
su - hindsight -c "
export HF_ENDPOINT=https://hf-mirror.com
source /opt/hindsight-env/bin/activate
python3 -c \"
from sentence_transformers import SentenceTransformer, CrossEncoder
print('Downloading embedding model...')
SentenceTransformer('BAAI/bge-small-en-v1.5')
print('Downloading reranker model...')
CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
print('Models ready!')
\"
"

# 6. Initialize database and fix auth
echo "[6/7] Initializing database..."
# Start the embedded PG once to create the database, then fix auth
su - hindsight -c "
source /opt/hindsight-env/bin/activate
export HF_ENDPOINT=https://hf-mirror.com
timeout 30 python3 -c '
from hindsight import HindsightServer
s = HindsightServer(port=18888, host=\"127.0.0.1\")
s.start()
import time; time.sleep(10)
s.stop()
' 2>/dev/null || true
"
# Fix PostgreSQL auth: change password to trust for local connections
PG_HBA=$(find /home/hindsight/.pg0 -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
    sed -i 's/password/trust/g' "$PG_HBA"
    # Reload PostgreSQL
    su - hindsight -c "kill -HUP \$(head -1 /home/hindsight/.pg0/instances/*/data/postmaster.pid 2>/dev/null) 2>/dev/null" || true
    echo "  Database auth fixed (trust mode for local connections)"
fi

# 7. Install systemd service and MCP stdio entry
echo "[7/7] Installing systemd service and MCP..."
if [ ! -f /opt/hindsight-env/serve.py ]; then
    echo ""
    echo "WARNING: /opt/hindsight-env/serve.py not found!"
    echo "Copy serve.py.template to /opt/hindsight-env/serve.py"
    echo "and fill in your OpenRouter API key before starting."
    echo ""
fi

# Create MCP stdio entry point
cat > /opt/hindsight-env/mcp_stdio.py << 'MCPEOF'
"""MemoMind MCP stdio server - connects to running Hindsight service."""
import os, sys

for k in ["http_proxy","https_proxy","HTTP_PROXY","HTTPS_PROXY","ALL_PROXY","all_proxy","no_proxy"]:
    os.environ.pop(k, None)
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

from hindsight_api.engine.memory_engine import MemoryEngine
from hindsight_api.api.mcp import create_mcp_server

engine = MemoryEngine(
    db_url="postgresql://hindsight@localhost:5432/hindsight",
    memory_llm_provider="openai",
    memory_llm_api_key=os.environ.get("HINDSIGHT_API_LLM_API_KEY", ""),
    memory_llm_model=os.environ.get("HINDSIGHT_API_LLM_MODEL", "qwen/qwen3.5-9b"),
    memory_llm_base_url=os.environ.get("HINDSIGHT_API_LLM_URL", "https://openrouter.ai/api/v1"),
)
mcp = create_mcp_server(engine)
mcp.run(transport="stdio")
MCPEOF
chown hindsight:hindsight /opt/hindsight-env/mcp_stdio.py

cp "$(dirname "$0")/hindsight.service" /etc/systemd/system/hindsight.service
systemctl daemon-reload
systemctl enable hindsight

echo ""
echo "========================================="
echo "  Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Copy serve.py.template to /opt/hindsight-env/serve.py"
echo "  2. Edit serve.py and add your OpenRouter API key"
echo "  3. Run: systemctl start hindsight"
echo "  4. Register MCP in Claude Code (stdio mode, no port forwarding needed):"
echo '     claude mcp add --scope user --transport stdio memomind \'
echo '       -- wsl -d Ubuntu -u hindsight -e //opt/hindsight-env/bin/python3 //opt/hindsight-env/mcp_stdio.py'
echo ""
