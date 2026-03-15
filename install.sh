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

# 6. Install systemd service
echo "[6/6] Installing systemd service..."
if [ ! -f /opt/hindsight-env/serve.py ]; then
    echo ""
    echo "WARNING: /opt/hindsight-env/serve.py not found!"
    echo "Copy serve.py.template to /opt/hindsight-env/serve.py"
    echo "and fill in your OpenRouter API key before starting."
    echo ""
fi

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
echo "  4. On Windows, run update-portproxy.ps1 as admin"
echo "  5. Register MCP in Claude Code:"
echo "     claude mcp add --scope user --transport sse hindsight http://127.0.0.1:8888/mcp/"
echo ""
