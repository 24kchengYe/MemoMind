"""
MemoMind Dashboard - server (Docker) edition with session-login auth.

- Serves dashboard.html and proxies API calls to the api container.
- Formal login page (PBKDF2 password check + HMAC-signed session cookie),
  same pattern as InfoHub / Novel Reader.
- /login, /auth/login, /auth/logout are public; everything else requires a
  valid session cookie (HTML paths 303 -> /login, API paths 401).
- Vault proxy points back to wolf's NoteDiscovery over Tailscale.
"""
import hashlib
import hmac
import http.server
import json
import os
import re
import time
import base64
import urllib.request
import urllib.error
import urllib.parse

DASHBOARD_PORT = 9999

# ── Auth configuration (env-driven) ──
AUTH_ENABLED = os.getenv("MEMOMIND_AUTH_ENABLED", "false").lower() in {"1", "true", "yes", "on"}
AUTH_USERNAME = os.getenv("MEMOMIND_AUTH_USERNAME", "")
AUTH_PASSWORD_HASH = os.getenv("MEMOMIND_AUTH_PASSWORD_HASH", "")
SESSION_SECRET = os.getenv("MEMOMIND_SESSION_SECRET", "").encode("utf-8")
SESSION_TTL_SECONDS = int(os.getenv("MEMOMIND_SESSION_TTL_SECONDS", str(7 * 24 * 60 * 60)))
SESSION_COOKIE = "memomind_session"

# AI chat history for the "view original chat" feature (mounted volume)
AI_CHAT_ROOT = os.environ.get("AI_CHAT_ROOT", "/chat-history/total memory")
AI_CHAT_INDEX = os.path.join(AI_CHAT_ROOT, "index.json")
_chat_index_cache = None  # lazy-loaded

# Direct networking (no proxies on the server)
proxy_handler = urllib.request.ProxyHandler({})
_no_proxy_opener = urllib.request.build_opener(proxy_handler)
urllib.request.install_opener(_no_proxy_opener)

MEMOMIND_API = os.environ.get("MEMOMIND_API_URL", "http://memomind-api:19999")
# NoteDiscovery still runs on wolf; reachable over Tailscale
VAULT_BACKEND = os.environ.get("VAULT_BACKEND_URL", "http://100.101.229.33:9998")

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.html"), encoding="utf-8") as _f:
    DASHBOARD_HTML = _f.read()
# The dashboard JS calls whatever is in the #baseUrl input. Hardcoding
# 127.0.0.1 breaks remote browsers (their own localhost). Patch in a
# placeholder and fill it per-request with the actual page origin, so the
# page talks back to the same dashboard that served it (which proxies to the API).
DASHBOARD_HTML = DASHBOARD_HTML.replace(
    'value="http://127.0.0.1:19999"',
    'value="__PAGE_ORIGIN__"'
)
# Vault link: NoteDiscovery stays on wolf — point to its Tailscale address, not localhost.
DASHBOARD_HTML = DASHBOARD_HTML.replace(
    'href="http://127.0.0.1:9998/"',
    f'href="{VAULT_BACKEND}/"'
)


def _page_origin(headers) -> str:
    host = headers.get("Host", f"127.0.0.1:{DASHBOARD_PORT}")
    proto = headers.get("X-Forwarded-Proto", "http")
    return f"{proto}://{host}"

LOGIN_HTML = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MemoMind 登录</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:-apple-system,'Segoe UI',sans-serif}
.card{background:#1e293b;padding:40px 36px;border-radius:14px;width:320px;box-shadow:0 10px 40px rgba(0,0,0,.4)}
h1{color:#e2e8f0;font-size:20px;margin:0 0 6px;text-align:center}
p.sub{color:#64748b;font-size:13px;margin:0 0 24px;text-align:center}
input{width:100%;box-sizing:border-box;padding:11px 14px;margin-bottom:14px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:14px;outline:none}
input:focus{border-color:#38bdf8}
button{width:100%;padding:11px;border:0;border-radius:8px;background:#38bdf8;color:#0f172a;font-size:15px;font-weight:600;cursor:pointer}
button:hover{background:#7dd3fc}
.err{color:#f87171;font-size:13px;text-align:center;margin-bottom:12px;display:none}
</style></head><body>
<div class="card"><h1>MemoMind</h1><p class="sub">AI 记忆系统 Dashboard</p>
<div class="err" id="err">账号或密码错误</div>
<form method="post" action="/auth/login">
<input name="username" placeholder="邮箱" autocomplete="username" required>
<input name="password" type="password" placeholder="密码" autocomplete="current-password" required>
<button type="submit">登 录</button></form></div>
<script>if(location.search.includes('error'))document.getElementById('err').style.display='block'</script>
</body></html>"""


# ── Auth helpers ──
def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algo, iterations, salt_hex, expected_hex = stored_hash.split("$", 3)
        if algo != "pbkdf2":
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(actual.hex(), expected_hex)
    except Exception:
        return False


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _create_session(username: str) -> str:
    now = int(time.time())
    encoded = _b64encode(json.dumps(
        {"sub": username, "iat": now, "exp": now + SESSION_TTL_SECONDS},
        separators=(",", ":")
    ).encode("utf-8"))
    signature = _b64encode(hmac.new(SESSION_SECRET, encoded.encode("ascii"), hashlib.sha256).digest())
    return f"{encoded}.{signature}"


def _valid_session(cookie_header: str) -> bool:
    if not AUTH_ENABLED:
        return True
    if not cookie_header:
        return False
    token = None
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith(SESSION_COOKIE + "="):
            token = part[len(SESSION_COOKIE) + 1:]
            break
    if not token or "." not in token:
        return False
    encoded, signature = token.rsplit(".", 1)
    expected = _b64encode(hmac.new(SESSION_SECRET, encoded.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        return False
    try:
        payload = json.loads(_b64decode(encoded))
        return payload.get("exp", 0) > time.time()
    except Exception:
        return False


def _load_chat_index():
    global _chat_index_cache
    if _chat_index_cache is None:
        try:
            with open(AI_CHAT_INDEX, "r", encoding="utf-8") as f:
                _chat_index_cache = json.load(f)
        except Exception:
            _chat_index_cache = []
    return _chat_index_cache


def _find_chat_md(document_id: str):
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
    protocol_version = "HTTP/1.1"

    # ── auth gate ──
    def _authenticated(self) -> bool:
        return _valid_session(self.headers.get("Cookie", ""))

    def _require_auth(self) -> bool:
        """Return True if the request may proceed."""
        if not AUTH_ENABLED or self._authenticated():
            return True
        if self.path.startswith("/v1/") or self.path.startswith("/api/"):
            self._json_error(401, "authentication required")
        else:
            self.send_response(303)
            self.send_header("Location", "/login")
            self.send_header("Content-Length", "0")
            self.end_headers()
        return False

    def _serve_login(self):
        body = LOGIN_HTML.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_login(self):
        length = int(self.headers.get("Content-Length", 0))
        form = urllib.parse.parse_qs(self.rfile.read(length).decode("utf-8", "replace"))
        username = form.get("username", [""])[0]
        password = form.get("password", [""])[0]
        if (AUTH_USERNAME and AUTH_PASSWORD_HASH and SESSION_SECRET
                and hmac.compare_digest(username, AUTH_USERNAME)
                and _verify_password(password, AUTH_PASSWORD_HASH)):
            # Secure 只在 https（公网经 Caddy）时加，Tailscale 内网 http 也能保持会话
            secure_attr = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
            self.send_response(303)
            self.send_header("Location", "/")
            self.send_header(
                "Set-Cookie",
                f"{SESSION_COOKIE}={_create_session(username)}; Path=/; HttpOnly{secure_attr}; SameSite=Lax; Max-Age={SESSION_TTL_SECONDS}"
            )
            self.send_header("Content-Length", "0")
            self.end_headers()
        else:
            self.send_response(303)
            self.send_header("Location", "/login?error=1")
            self.send_header("Content-Length", "0")
            self.end_headers()

    def _handle_logout(self):
        self.send_response(303)
        self.send_header("Location", "/login")
        self.send_header("Set-Cookie", f"{SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0")
        self.send_header("Content-Length", "0")
        self.end_headers()

    # ── routes ──
    def do_GET(self):
        if self.path == "/login" or self.path.startswith("/login?"):
            self._serve_login()
        elif self.path == "/auth/logout":
            self._handle_logout()
        elif not self._require_auth():
            return
        elif self.path == "/" or self.path == "/dashboard":
            body = DASHBOARD_HTML.replace("__PAGE_ORIGIN__", _page_origin(self.headers)).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/vault" or self.path == "/vault/":
            self.send_response(302)
            self.send_header("Location", VAULT_BACKEND + "/")
            self.send_header("Content-Length", "0")
            self.end_headers()
        elif self.path.startswith("/vault/"):
            self._proxy_vault("GET")
        elif self.path.startswith("/api/original-chat/"):
            self._serve_original_chat()
        else:
            self._proxy("GET")

    def do_POST(self):
        if self.path == "/auth/login":
            self._handle_login()
        elif not self._require_auth():
            return
        elif self.path.startswith("/vault"):
            self._proxy_vault("POST")
        else:
            self._proxy("POST")

    def do_PUT(self):
        if not self._require_auth():
            return
        if self.path.startswith("/vault"):
            self._proxy_vault("PUT")
        else:
            self._proxy("PUT")

    def do_DELETE(self):
        if not self._require_auth():
            return
        if self.path.startswith("/vault"):
            self._proxy_vault("DELETE")
        else:
            self._proxy("DELETE")

    def _serve_original_chat(self):
        parts = self.path.split("/api/original-chat/", 1)
        if len(parts) < 2 or not parts[1]:
            self._json_error(400, "Missing document identifier")
            return

        doc_id = urllib.parse.unquote(parts[1].split("?")[0])
        md_path = _find_chat_md(doc_id)

        if not md_path:
            try:
                bank = self._get_bank()
                url = f"{MEMOMIND_API}/v1/default/banks/{bank}/documents/{doc_id}"
                req = urllib.request.Request(url, method="GET")
                req.add_header("Accept", "application/json")
                with _no_proxy_opener.open(req, timeout=10) as resp:
                    doc = json.loads(resp.read())
                params = doc.get("retain_params", "")
                if isinstance(params, str):
                    try:
                        params = json.loads(params)
                    except Exception:
                        params = {}
                orig_doc_id = params.get("original_document_id") if isinstance(params, dict) else None
                if orig_doc_id:
                    md_path = _find_chat_md(orig_doc_id)
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
            body = content.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self._json_error(500, f"Failed to read file: {e}")

    def _get_bank(self):
        if "?" in self.path:
            qs = urllib.parse.parse_qs(self.path.split("?", 1)[1])
            return qs.get("bank", ["default"])[0]
        return "default"

    def _json_error(self, code, message):
        body = json.dumps({"error": message}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _proxy_vault(self, method):
        backend_path = self.path[len("/vault"):] or "/"
        url = VAULT_BACKEND + backend_path
        try:
            body = None
            if method in ("POST", "PUT", "DELETE"):
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length) if length > 0 else None
            req = urllib.request.Request(url, data=body, method=method)
            for h in ("Content-Type", "Accept", "Authorization"):
                val = self.headers.get(h)
                if val:
                    req.add_header(h, val)
            with _no_proxy_opener.open(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.status)
                ct = resp.headers.get("Content-Type", "application/octet-stream")
                self.send_header("Content-Type", ct)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "text/html"))
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self._json_error(502, f"Vault backend unavailable: {e}")

    def _proxy(self, method):
        url = MEMOMIND_API + self.path
        try:
            body = None
            if method in ("POST", "PUT", "DELETE"):
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
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self._json_error(502, str(e))

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    # Threading: HTTP/1.1 keep-alive + browsers' parallel connections would
    # otherwise block the single-threaded HTTPServer and hang the dashboard.
    server = http.server.ThreadingHTTPServer(("0.0.0.0", DASHBOARD_PORT), DashboardHandler)
    server.daemon_threads = True
    print(f"MemoMind Dashboard on :{DASHBOARD_PORT} (auth={'on' if AUTH_ENABLED else 'off'})")
    server.serve_forever()
