"""
MemoMind Weekly Memory Backup
Exports all memories from MemoMind API and saves as JSON.
Run via Task Scheduler or manually: python backup-memomind.py
"""
import json, os, sys, subprocess, urllib.request, urllib.error
from datetime import datetime

BACKUP_DIR = os.path.dirname(os.path.abspath(__file__))
API_BASE = "http://127.0.0.1:8888"
BANK = "default"
DATE = datetime.now().strftime("%Y-%m-%d")
FILENAME = f"memomind-{BANK}-{DATE}.json"

# Disable proxy
for k in ["http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy"]:
    os.environ.pop(k, None)
proxy_handler = urllib.request.ProxyHandler({})
opener = urllib.request.build_opener(proxy_handler)
urllib.request.install_opener(opener)


def api_get(path):
    url = API_BASE + path
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def api_post(path, body):
    url = API_BASE + path
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    print(f"[MemoMind Backup] Starting at {datetime.now()}")

    # Health check
    try:
        health = api_get("/health")
        if health.get("status") != "healthy":
            print(f"[ERROR] Not healthy: {health}")
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Cannot reach MemoMind at {API_BASE}: {e}")
        sys.exit(1)

    # Fetch data
    banks = api_get("/v1/default/banks")
    bank_info = next((b for b in banks.get("banks", []) if b["bank_id"] == BANK), {})
    stats = api_get(f"/v1/default/banks/{BANK}/stats")
    mem_list = api_get(f"/v1/default/banks/{BANK}/memories/list?limit=10000")
    graph = api_get(f"/v1/default/banks/{BANK}/graph")

    # Fetch detailed info per memory
    items = mem_list.get("items", [])
    detailed = []
    for m in items:
        try:
            d = api_get(f"/v1/default/banks/{BANK}/memories/{m['id']}")
            detailed.append(d)
        except Exception:
            detailed.append(m)

    # Build export
    export = {
        "version": "1.0",
        "format": "memomind-export",
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "bank": {
            "bank_id": BANK,
            "name": bank_info.get("name", BANK),
            "mission": bank_info.get("mission", ""),
        },
        "stats": stats,
        "memories": [
            {
                "id": m.get("id"),
                "text": m.get("text", ""),
                "context": m.get("context", ""),
                "date": m.get("date"),
                "fact_type": m.get("type") or m.get("fact_type", "world"),
                "entities": m.get("entities", []),
                "tags": m.get("tags", []),
                "occurred_start": m.get("occurred_start"),
                "occurred_end": m.get("occurred_end"),
                "source_memory_ids": m.get("source_memory_ids", []),
                "source_memories": [
                    {"id": s.get("id"), "text": s.get("text", "")}
                    for s in (m.get("source_memories") or [])
                ],
                "history": m.get("history", []),
                "proof_count": m.get("proof_count", 0),
            }
            for m in detailed
        ],
        "graph": {
            "nodes": [(n.get("data") or n) for n in graph.get("nodes", [])],
            "edges": [(e.get("data") or e) for e in graph.get("edges", [])],
        },
    }

    # Save
    filepath = os.path.join(BACKUP_DIR, FILENAME)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(export, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(filepath) / 1024
    print(f"[MemoMind Backup] Saved {FILENAME} ({size_kb:.1f} KB, {len(detailed)} memories)")

    # Git commit and push
    os.chdir(BACKUP_DIR)
    subprocess.run(["git", "add", FILENAME], check=True)
    msg = f"Backup {DATE}: {len(detailed)} memories, {stats.get('total_nodes', 0)} nodes"
    subprocess.run(["git", "commit", "-m", msg], check=True)
    subprocess.run(["git", "push", "origin", "master"], check=True)
    print("[MemoMind Backup] Pushed to GitHub successfully")


if __name__ == "__main__":
    main()
