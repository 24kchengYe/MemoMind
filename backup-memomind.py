"""
MemoMind Weekly Memory Backup
Exports all memories from MemoMind API and saves as JSON.
Run via Task Scheduler or manually: python backup-memomind.py

Flags:
  --no-prune    Skip observation pruning step
"""
import argparse
import json, os, sys, subprocess, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

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

PRUNE_AGE_DAYS = 30
PRUNE_MAX_PROOF = 1


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


def api_delete(path):
    url = API_BASE + path
    req = urllib.request.Request(url, method="DELETE",
                                 headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def prune_stale_observations(detailed):
    """Delete observations with proof_count <= 1 that are older than 30 days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=PRUNE_AGE_DAYS)
    pruned = []

    for m in detailed:
        fact_type = m.get("type") or m.get("fact_type", "")
        if fact_type != "observation":
            continue
        proof_count = m.get("proof_count", 0)
        if proof_count > PRUNE_MAX_PROOF:
            continue

        # Parse date — try ISO format first, fall back to date-only
        date_str = m.get("date") or m.get("occurred_start") or ""
        if not date_str:
            continue
        try:
            if "T" in date_str:
                mem_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            else:
                mem_date = datetime.strptime(date_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            continue

        if mem_date < cutoff:
            mem_id = m.get("id")
            try:
                api_delete(f"/v1/default/banks/{BANK}/memories/{mem_id}")
                pruned.append({"id": mem_id, "text": m.get("text", "")[:80], "proof_count": proof_count})
                print(f"  [Prune] Deleted observation {mem_id} (proof={proof_count}, date={date_str[:10]})")
            except Exception as e:
                print(f"  [Prune] Failed to delete {mem_id}: {e}")

    return pruned


def filter_graph_edges(graph):
    """Filter graph edges to reduce backup size.

    - Remove temporal edges (reconstructable from timestamps)
    - Only include semantic edges with weight > 0.3
    - Keep all entity edges (most valuable)

    Returns (filtered_graph, summary) where summary shows counts before filtering.
    """
    raw_nodes = [(n.get("data") or n) for n in graph.get("nodes", [])]
    raw_edges = [(e.get("data") or e) for e in graph.get("edges", [])]

    # Count edges by type before filtering
    type_counts = {}
    for e in raw_edges:
        etype = e.get("type", e.get("edge_type", "unknown"))
        type_counts[etype] = type_counts.get(etype, 0) + 1

    summary = {
        "total_edges_before_filter": len(raw_edges),
        "total_nodes": len(raw_nodes),
        "edges_by_type": type_counts,
    }

    # Filter edges
    kept_edges = []
    for e in raw_edges:
        etype = e.get("type", e.get("edge_type", "unknown"))

        # Drop temporal edges — they can be reconstructed from timestamps
        if etype in ("temporal", "time", "temporal_proximity", "sequence"):
            continue

        # For semantic edges, only keep those with weight > 0.3
        if etype in ("semantic", "semantic_similarity"):
            weight = e.get("weight", e.get("score", 0))
            if weight <= 0.3:
                continue

        # Keep entity edges and everything else
        kept_edges.append(e)

    summary["total_edges_after_filter"] = len(kept_edges)

    filtered_graph = {
        "nodes": raw_nodes,
        "edges": kept_edges,
    }
    return filtered_graph, summary


def main():
    parser = argparse.ArgumentParser(description="MemoMind Weekly Backup")
    parser.add_argument("--no-prune", action="store_true",
                        help="Skip observation pruning step")
    args = parser.parse_args()

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

    # Filter graph edges to reduce backup size
    filtered_graph, graph_summary = filter_graph_edges(graph)
    print(f"[MemoMind Backup] Graph: {graph_summary['total_edges_before_filter']} edges "
          f"-> {graph_summary['total_edges_after_filter']} after filtering")

    # Build export
    export = {
        "version": "1.1",
        "format": "memomind-export",
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "bank": {
            "bank_id": BANK,
            "name": bank_info.get("name", BANK),
            "mission": bank_info.get("mission", ""),
        },
        "stats": stats,
        "graph_summary": graph_summary,
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
        "graph": filtered_graph,
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

    # --- Observation Pruning ---
    # Delete low-value observations (proof_count <= 1, older than 30 days)
    if args.no_prune:
        print("[MemoMind Prune] Skipped (--no-prune flag)")
    else:
        print(f"[MemoMind Prune] Scanning for stale observations "
              f"(proof <= {PRUNE_MAX_PROOF}, age > {PRUNE_AGE_DAYS} days)...")
        pruned = prune_stale_observations(detailed)
        if pruned:
            print(f"[MemoMind Prune] Deleted {len(pruned)} stale observations")
        else:
            print("[MemoMind Prune] No stale observations found")

    # --- PostgreSQL VACUUM ---
    # NOTE: PostgreSQL autovacuum handles space reclamation automatically.
    # The embedded PostgreSQL used by MemoMind has autovacuum enabled by default,
    # so manual VACUUM is not needed here. If you observe table bloat, you can run:
    #   wsl -d Ubuntu -u memomind -- vacuumdb --all --analyze
    # But this should rarely be necessary for normal operation.

    print(f"[MemoMind Backup] Done at {datetime.now()}")


if __name__ == "__main__":
    main()
