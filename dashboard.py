"""
MemoMind Dashboard - Local web UI for viewing memories.
Run on Windows: pythonw dashboard.py (or python dashboard.py)
Proxies API requests to MemoMind backend (WSL port 8888 via portproxy).
Opens at http://localhost:9999
"""
import http.server
import json
import os
import urllib.request
import urllib.error

DASHBOARD_PORT = 9999

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


class DashboardHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/" or self.path == "/dashboard":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(DASHBOARD_HTML.encode())
        else:
            self._proxy("GET")

    def do_POST(self):
        self._proxy("POST")

    def do_DELETE(self):
        self._proxy("DELETE")

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
