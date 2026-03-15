#!/bin/bash
# ============================================================
# MemoMind Installer - One-script setup for WSL2 Ubuntu
# Run inside WSL2: sudo bash install.sh
# ============================================================

set -e

echo "========================================="
echo "  MemoMind - Local Agent Memory System"
echo "========================================="
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash install.sh"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 1. Install system dependencies
echo "[1/7] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq python3-pip python3-venv socat curl

# 2. Install uv (fast Python package manager)
echo "[2/7] Installing uv..."
if ! command -v /root/.local/bin/uv &>/dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH=$HOME/.local/bin:$PATH

# 3. Create venv and install MemoMind engine
echo "[3/7] Creating Python environment..."
uv venv /opt/memomind-env
uv pip install --python /opt/memomind-env/bin/python3 hindsight-all hindsight-api

# 4. Create memomind user
echo "[4/7] Creating memomind user..."
id memomind 2>/dev/null || useradd -m -s /bin/bash memomind
chown -R memomind:memomind /opt/memomind-env

# 5. Download embedding models (via China mirror)
echo "[5/7] Downloading embedding models..."
export HF_ENDPOINT=https://hf-mirror.com
su - memomind -c "
export HF_ENDPOINT=https://hf-mirror.com
source /opt/memomind-env/bin/activate
python3 -c \"
from sentence_transformers import SentenceTransformer, CrossEncoder
print('Downloading multilingual embedding model (bge-m3)...')
SentenceTransformer('BAAI/bge-m3')
print('Downloading reranker model...')
CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
print('Models ready!')
\"
"

# 6. Initialize database and fix auth
echo "[6/7] Initializing database..."
su - memomind -c "
source /opt/memomind-env/bin/activate
export HF_ENDPOINT=https://hf-mirror.com
timeout 60 python3 -c '
from hindsight import HindsightServer
s = HindsightServer(port=18888, host=\"127.0.0.1\")
s.start()
import time; time.sleep(10)
s.stop()
' 2>/dev/null || true
"
PG_HBA=$(find /home/memomind/.pg0 -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
    sed -i 's/password/trust/g' "$PG_HBA"
    su - memomind -c "kill -HUP \$(head -1 /home/memomind/.pg0/instances/*/data/postmaster.pid 2>/dev/null) 2>/dev/null" || true
    echo "  Database auth fixed (trust mode)"
fi

# Patch startup timeout (default 30s is too short for cold CUDA load)
SERVER_PY=$(find /opt/memomind-env -name 'server.py' -path '*/hindsight/*' | head -1)
if [ -n "$SERVER_PY" ]; then
    sed -i 's/def start(self, timeout: float = [0-9.]*/def start(self, timeout: float = 600.0/' "$SERVER_PY"
    find /opt/memomind-env -name '*.pyc' -delete 2>/dev/null
    echo "  Startup timeout patched to 600s"
fi

# 7. Install config files, systemd service, and MCP entry
echo "[7/7] Installing service and config..."

# Copy serve.py template if not already configured
if [ ! -f /opt/memomind-env/serve.py ]; then
    cp "$SCRIPT_DIR/serve.py.template" /opt/memomind-env/serve.py
    echo "  Copied serve.py.template → /opt/memomind-env/serve.py"
    echo "  *** EDIT THIS FILE to set your LLM API key! ***"
fi

# Create start wrapper
cat > /opt/memomind-env/start-memomind.sh << 'STARTEOF'
#!/bin/bash
unset ALL_PROXY all_proxy HTTP_PROXY http_proxy HTTPS_PROXY https_proxy
export HF_ENDPOINT="https://hf-mirror.com"
exec /opt/memomind-env/bin/python3 /opt/memomind-env/serve.py
STARTEOF
chmod +x /opt/memomind-env/start-memomind.sh

# Create MCP entry wrapper (avoids Git Bash path translation issues on Windows)
cat > /opt/memomind-env/mcp-entry.sh << 'ENTRYEOF'
#!/bin/bash
exec /opt/memomind-env/bin/python3 /opt/memomind-env/mcp_stdio.py
ENTRYEOF
chmod +x /opt/memomind-env/mcp-entry.sh

# Create MCP stdio entry point
# NOTE: reads LLM config from serve.py at runtime so you only configure once
cat > /opt/memomind-env/mcp_stdio.py << 'MCPEOF'
"""MemoMind MCP stdio server — reads LLM config from serve.py."""
import os, sys, importlib.util

# Clear all proxy vars
for k in ["ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy"]:
    os.environ.pop(k, None)

# ── Read LLM config from serve.py (single source of truth) ──
_serve_path = os.path.join(os.path.dirname(__file__), "serve.py")
LLM_API_KEY = "your-api-key"
LLM_BASE_URL = "https://api.mindcraft.com.cn/v1"
LLM_MODEL = "deepseek-chat"
NEEDS_PROXY = False

try:
    with open(_serve_path) as f:
        _code = f.read()
    _ns = {}
    # Extract config variables from serve.py without executing the whole server
    for line in _code.split("\n"):
        line = line.strip()
        for var in ["LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL", "NEEDS_PROXY"]:
            if line.startswith(f"{var} =") and not line.startswith("#"):
                exec(line, _ns)
    LLM_API_KEY = _ns.get("LLM_API_KEY", LLM_API_KEY)
    LLM_BASE_URL = _ns.get("LLM_BASE_URL", LLM_BASE_URL)
    LLM_MODEL = _ns.get("LLM_MODEL", LLM_MODEL)
    NEEDS_PROXY = _ns.get("NEEDS_PROXY", NEEDS_PROXY)
    print(f"[MemoMind MCP] Config from serve.py: model={LLM_MODEL}, proxy={NEEDS_PROXY}", file=sys.stderr)
except Exception as e:
    print(f"[MemoMind MCP] Warning: could not read serve.py ({e}), using defaults", file=sys.stderr)

if NEEDS_PROXY:
    _win_host = "172.17.112.1"
    try:
        with open("/etc/resolv.conf") as f:
            for line in f:
                if line.startswith("nameserver"):
                    _win_host = line.split()[1]
                    break
    except Exception:
        pass
    _proxy = f"http://{_win_host}:12080"
    os.environ["HTTPS_PROXY"] = _proxy
    os.environ["HTTP_PROXY"] = _proxy
    os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1,0.0.0.0"

os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

from hindsight_api.engine.memory_engine import MemoryEngine
from hindsight_api.api.mcp import create_mcp_server

engine = MemoryEngine(
    db_url="postgresql://hindsight@localhost:5432/hindsight",
    memory_llm_provider="openai",
    memory_llm_api_key=LLM_API_KEY,
    memory_llm_model=LLM_MODEL,
    memory_llm_base_url=LLM_BASE_URL,
    retain_llm_provider="openai",
    retain_llm_api_key=LLM_API_KEY,
    retain_llm_model=LLM_MODEL,
    retain_llm_base_url=LLM_BASE_URL,
    reflect_llm_provider="openai",
    reflect_llm_api_key=LLM_API_KEY,
    reflect_llm_model=LLM_MODEL,
    reflect_llm_base_url=LLM_BASE_URL,
    consolidation_llm_provider="openai",
    consolidation_llm_api_key=LLM_API_KEY,
    consolidation_llm_model=LLM_MODEL,
    consolidation_llm_base_url=LLM_BASE_URL,
)
mcp = create_mcp_server(engine)
mcp.run(transport="stdio")
MCPEOF

# Copy CLI wrapper
cp "$SCRIPT_DIR/memomind-cli.sh.template" /opt/memomind-env/memomind-cli.sh
chmod +x /opt/memomind-env/memomind-cli.sh

# Fix ownership
chown -R memomind:memomind /opt/memomind-env/

# Install systemd service
cp "$SCRIPT_DIR/memomind.service" /etc/systemd/system/memomind.service
systemctl daemon-reload
systemctl enable memomind

echo ""
echo "========================================="
echo "  Installation Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit LLM config (API key + model):"
echo "     nano /opt/memomind-env/serve.py"
echo ""
echo "  2. Start the service:"
echo "     sudo systemctl start memomind"
echo ""
echo "  3. Register MCP in Claude Code (run from Windows terminal):"
echo '     claude mcp add --scope user --transport stdio memomind \'
echo '       -- wsl -d Ubuntu -u memomind -e //opt/memomind-env/mcp-entry.sh'
echo ""
echo "  4. (Optional) Auto-start on boot:"
echo '     Copy keep-wsl-alive.vbs to Windows Startup folder'
echo ""
echo "  5. (Optional) Dashboard on Windows:"
echo "     pythonw dashboard.py    → http://localhost:9999"
echo "     (requires portproxy: powershell -ExecutionPolicy Bypass -File update-portproxy.ps1)"
echo ""
