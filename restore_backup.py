"""
Restore memories from a MemoMind backup JSON file.

Usage:
  python restore_backup.py backup.json
  python restore_backup.py backup.json --bank-id docs
  python restore_backup.py backup.json --exclude-context ai-chat-import
  python restore_backup.py backup.json --include-context daylife
  python restore_backup.py backup.json --dry-run
"""
import json
import urllib.request
import urllib.error
import os
import sys
import io
import re
import time
import argparse

# Fix Windows console encoding for emoji
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

MEMOMIND_API = "http://127.0.0.1:19999"

# Disable proxy
for k in ["ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"]:
    os.environ.pop(k, None)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def load_backup(path):
    """Load and parse a MemoMind backup JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    memories = data.get("memories", [])
    version = data.get("version", "unknown")
    return version, memories


def matches_pattern(value, pattern):
    """Check if value matches a pattern (substring or regex)."""
    if not value:
        return False
    try:
        return bool(re.search(pattern, value, re.IGNORECASE))
    except re.error:
        # Fall back to simple substring match
        return pattern.lower() in value.lower()


def retain(content, timestamp, context, tags, bank_id, dry_run=False):
    """Call MemoMind retain API for a single memory."""
    if dry_run:
        return {"status": "dry-run"}

    item = {"content": content}
    if timestamp:
        item["timestamp"] = timestamp
    if context:
        item["context"] = context
    if tags:
        item["tags"] = tags

    payload = {
        "items": [item],
        "async": True,
    }

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{MEMOMIND_API}/v1/default/banks/{bank_id}/memories",
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with opener.open(req, timeout=120) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}
    except Exception as e:
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Restore memories from MemoMind backup JSON")
    parser.add_argument("backup_file", help="Path to backup JSON file")
    parser.add_argument("--bank-id", default="default", help="Target bank ID (default: 'default')")
    parser.add_argument("--exclude-context", default=None,
                        help="Exclude memories whose context matches this pattern (regex or substring)")
    parser.add_argument("--include-context", default=None,
                        help="Only include memories whose context matches this pattern (regex or substring)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Delay between API calls in seconds (default: 0.5)")
    args = parser.parse_args()

    # Load backup
    print(f"[Restore] Loading backup from {args.backup_file}")
    version, memories = load_backup(args.backup_file)
    print(f"  Backup version: {version}")
    print(f"  Total memories in backup: {len(memories)}")

    # Filter
    filtered = []
    excluded_count = 0
    for mem in memories:
        ctx = mem.get("context", "") or ""

        if args.include_context and not matches_pattern(ctx, args.include_context):
            excluded_count += 1
            continue

        if args.exclude_context and matches_pattern(ctx, args.exclude_context):
            excluded_count += 1
            continue

        filtered.append(mem)

    if excluded_count > 0:
        print(f"  Filtered out {excluded_count} memories, {len(filtered)} remaining")

    if not filtered:
        print("  No memories to restore.")
        return

    print(f"  Target bank: {args.bank_id}")
    if args.dry_run:
        print("  [DRY RUN - no data will be written]\n")
    else:
        print()

    success = 0
    failed = 0
    total = len(filtered)

    for i, mem in enumerate(filtered):
        text = mem.get("text", "")
        context = mem.get("context", "")
        tags = mem.get("tags", [])
        occurred_start = mem.get("occurred_start")
        date = mem.get("date")
        mem_id = mem.get("id", "?")[:12]

        # Use occurred_start if available, otherwise date
        timestamp = occurred_start or date

        # Progress
        progress = f"[{i + 1}/{total}]"
        preview = text[:60].replace("\n", " ") if text else "(empty)"
        print(f"  {progress} {mem_id}... | {preview}", end="")

        if args.dry_run:
            print(f" -> DRY RUN")
            if i < 5:
                print(f"         context={context}, tags={tags}, ts={timestamp}")
        else:
            result = retain(text, timestamp, context, tags, args.bank_id)
            if "error" in result:
                print(f" -> FAILED: {result}")
                failed += 1
            else:
                print(f" -> OK")
                success += 1

            if i < total - 1:
                time.sleep(args.delay)

    print()
    if args.dry_run:
        print(f"[Done] Dry run complete. {total} memories would be restored.")
    else:
        print(f"[Done] Success: {success}, Failed: {failed}, Total: {total}")


if __name__ == "__main__":
    main()
