"""
MemoMind Dashboard - Local web UI for viewing memories.
Run on Windows: pythonw dashboard.py (or python dashboard.py)
Proxies API requests to MemoMind backend (WSL port 8888 via portproxy).
Opens at http://localhost:9999
"""
import http.server
import json
import os
import re
import urllib.request
import urllib.error
import urllib.parse

DASHBOARD_PORT = 9999

# AI chat history paths for "view original chat" feature
AI_CHAT_ROOT = r"D:\pythonPycharms\memomind-memory\ai-chat-history(chatgpt+gemini)\total memory"
AI_CHAT_INDEX = os.path.join(AI_CHAT_ROOT, "index.json")
_chat_index_cache = None  # lazy-loaded

# Disable proxy for urllib FIRST (bypass Clash/system proxy)
os.environ.pop("http_proxy", None)
os.environ.pop("https_proxy", None)
os.environ.pop("HTTP_PROXY", None)
os.environ.pop("HTTPS_PROXY", None)
os.environ.pop("ALL_PROXY", None)
os.environ.pop("all_proxy", None)
proxy_handler = urllib.request.ProxyHandler({})
_no_proxy_opener = urllib.request.build_opener(proxy_handler)
urllib.request.install_opener(_no_proxy_opener)

# Auto-detect MemoMind API: try localhost first (mirrored mode), then WSL IP
MEMOMIND_API = "http://127.0.0.1:19999"
try:
    import subprocess
    _wsl_ip = subprocess.check_output(
        ["wsl", "-d", "Ubuntu", "--", "bash", "-c", "hostname -I"],
        timeout=5
    ).decode().strip().split()[0]
    # Test if localhost works (mirrored mode auto-maps WSL ports)
    _test_req = urllib.request.Request(MEMOMIND_API + "/health")
    try:
        _no_proxy_opener.open(_test_req, timeout=2)
    except Exception:
        # Localhost failed, use WSL IP directly
        MEMOMIND_API = f"http://{_wsl_ip}:18888"
        print(f"[Dashboard] Using WSL IP: {MEMOMIND_API}")
except Exception:
    pass  # stick with localhost

with open(os.path.join(os.path.dirname(__file__) or ".", "dashboard.html"), encoding="utf-8") as _f:
    DASHBOARD_HTML = _f.read()
# Patch the default URL to point to the dashboard proxy (not directly to API)
DASHBOARD_HTML = DASHBOARD_HTML.replace(
    'value="http://127.0.0.1:19999"',
    f'value="http://127.0.0.1:{DASHBOARD_PORT}"'
)


def _load_chat_index():
    """Load and cache the AI chat history index.json."""
    global _chat_index_cache
    if _chat_index_cache is None:
        try:
            with open(AI_CHAT_INDEX, "r", encoding="utf-8") as f:
                _chat_index_cache = json.load(f)
        except Exception:
            _chat_index_cache = []
    return _chat_index_cache


def _find_chat_md(document_id: str) -> str | None:
    """Find the .md file path for a given document_id (conversation id).

    The index.json stores entries like:
      {"id": "676c0892-...", "filePath": "chatgpt/20241225_xxx.json"}
    The corresponding .md has the same path with .json replaced by .md.
    """
    index = _load_chat_index()
    for entry in index:
        if entry.get("id") == document_id:
            json_path = entry.get("filePath", "")
            md_path = re.sub(r"\.json$", ".md", json_path)
            full_path = os.path.join(AI_CHAT_ROOT, md_path)
            if os.path.isfile(full_path):
                return full_path
            return None
    return None


class DashboardHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/" or self.path == "/dashboard":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(DASHBOARD_HTML.encode())
        elif self.path.startswith("/api/original-chat/"):
            self._serve_original_chat()
        else:
            self._proxy("GET")

    def do_POST(self):
        self._proxy("POST")

    def do_DELETE(self):
        self._proxy("DELETE")

    def _serve_original_chat(self):
        """Serve the original .md chat file for a given document hash or conversation id."""
        parts = self.path.split("/api/original-chat/", 1)
        if len(parts) < 2 or not parts[1]:
            self._json_error(400, "Missing document identifier")
            return

        doc_id = urllib.parse.unquote(parts[1].split("?")[0])
        md_path = None

        # 1. Try direct lookup by conversation UUID in index
        md_path = _find_chat_md(doc_id)

        # 2. If not found, treat as MemoMind document hash — query document API for title
        if not md_path:
            try:
                bank = self._get_bank()
                url = f"{MEMOMIND_API}/v1/default/banks/{bank}/documents/{doc_id}"
                req = urllib.request.Request(url, method="GET")
                req.add_header("Accept", "application/json")
                with _no_proxy_opener.open(req, timeout=10) as resp:
                    doc = json.loads(resp.read())
                # Try original_document_id first (if patched engine)
                params = doc.get("retain_params", "")
                if isinstance(params, str):
                    try:
                        params = json.loads(params)
                    except Exception:
                        params = {}
                orig_doc_id = params.get("original_document_id") if isinstance(params, dict) else None
                if orig_doc_id:
                    md_path = _find_chat_md(orig_doc_id)

                # Fallback: extract title from original_text
                if not md_path:
                    orig_text = doc.get("original_text", "")
                    if "] " in orig_text:
                        title = orig_text.split("] ", 1)[1].split(" | ")[0].strip()
                        index = _load_chat_index()
                        for entry in index:
                            if entry.get("title", "").strip() == title:
                                md_path = _find_chat_md(entry["id"])
                                break
            except Exception:
                pass

        if not md_path:
            self._json_error(404, "Original chat not found for this memory")
            return

        try:
            with open(md_path, "r", encoding="utf-8") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))
        except Exception as e:
            self._json_error(500, f"Failed to read file: {e}")

    def _get_bank(self):
        """Extract bank from query params or default to 'default'."""
        if "?" in self.path:
            qs = urllib.parse.parse_qs(self.path.split("?", 1)[1])
            return qs.get("bank", ["default"])[0]
        return "default"

    def _json_error(self, code, message):
        """Send a JSON error response."""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())

    def do_OPTIONS(self):
        """CORS preflight handler."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.end_headers()

    def _proxy(self, method):
        """Proxy requests to MemoMind API."""
        url = MEMOMIND_API + self.path
        try:
            body = None
            if method in ("POST", "DELETE"):
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length) if length > 0 else None

            req = urllib.request.Request(url, data=body, method=method)
            req.add_header("Content-Type", "application/json")
            req.add_header("Accept", "application/json")

            with _no_proxy_opener.open(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, format, *args):
        pass  # Suppress default logging


if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", DASHBOARD_PORT), DashboardHandler)
    print(f"MemoMind Dashboard running at http://localhost:{DASHBOARD_PORT}")
    print("Press Ctrl+C to stop")
    server.serve_forever()
