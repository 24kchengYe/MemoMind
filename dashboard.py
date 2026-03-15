"""
MemoMind Dashboard - Local web UI for viewing memories.
Run in WSL: python3 dashboard.py
Opens at http://localhost:9999
"""
import http.server
import json
import os
import urllib.request
import urllib.error

HINDSIGHT_API = "http://localhost:8888"
DASHBOARD_PORT = 9999

DASHBOARD_HTML = open(os.path.join(os.path.dirname(__file__) or ".", "dashboard.html")).read()
# Patch the default URL to point to the dashboard proxy
DASHBOARD_HTML = DASHBOARD_HTML.replace(
    'value="http://localhost:8888"',
    f'value="http://localhost:{DASHBOARD_PORT}"'
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

    def _proxy(self, method):
        """Proxy requests to Hindsight API."""
        url = HINDSIGHT_API + self.path
        try:
            body = None
            if method == "POST":
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length) if length > 0 else None

            req = urllib.request.Request(url, data=body, method=method)
            req.add_header("Content-Type", "application/json")
            req.add_header("Accept", "application/json")

            with urllib.request.urlopen(req, timeout=30) as resp:
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
