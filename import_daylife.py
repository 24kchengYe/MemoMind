"""
Import DayLife records into MemoMind's 'life' bank.
One retain call per event (not per day).

Usage: python import_daylife.py [--dry-run] [--from-date 2024-01-01] [--to-date 2026-12-31]
"""
import sqlite3
import json
import urllib.request
import urllib.error
import os
import sys
import io
import time
import argparse

# Fix Windows console encoding for emoji
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Config
DAYLIFE_DB = os.path.expanduser("~/.local/share/daylife/daylife.db")
MEMOMIND_API = "http://127.0.0.1:19999"
BANK_ID = "life"

# Disable proxy
for k in ["ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"]:
    os.environ.pop(k, None)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def get_entries(db_path, date_from=None, date_to=None):
    """Read all entries from DayLife SQLite DB."""
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    query = """
        SELECT e.id, e.date, c.icon, c.name as category, e.content, e.status,
               e.start_time, e.end_time, e.duration_minutes, e.priority, e.notes
        FROM daily_entries e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE 1=1
    """
    params = []
    if date_from:
        query += " AND e.date >= ?"
        params.append(date_from)
    if date_to:
        query += " AND e.date <= ?"
        params.append(date_to)
    query += " ORDER BY e.date ASC, e.start_time ASC, e.id ASC"

    rows = db.execute(query, params).fetchall()
    db.close()
    return rows


def format_event_content(row):
    """Format a single event into a self-contained string for retain.

    Format: "2024年3月15日 [科研] 写论文第三章 已完成 (9:00-12:30, 210分钟)"
    """
    date = row["date"]
    # Convert date to Chinese format: 2024年3月15日
    try:
        parts = date.split("-")
        date_cn = f"{int(parts[0])}年{int(parts[1])}月{int(parts[2])}日"
    except (ValueError, IndexError):
        date_cn = date

    icon = row["icon"] or ""
    cat = row["category"] or "未分类"
    content = row["content"] or ""

    status = row["status"] or ""
    status_str = ""
    if status == "completed":
        status_str = " 已完成"
    elif status == "incomplete":
        status_str = " 未完成"

    time_str = ""
    if row["start_time"] and row["end_time"]:
        time_str = f"{row['start_time']}-{row['end_time']}"
    elif row["start_time"]:
        time_str = f"{row['start_time']}"

    dur_str = ""
    if row["duration_minutes"]:
        dur_str = f"{row['duration_minutes']}分钟"

    # Build parenthetical: (9:00-12:30, 210分钟)
    paren_parts = []
    if time_str:
        paren_parts.append(time_str)
    if dur_str:
        paren_parts.append(dur_str)
    paren = f" ({', '.join(paren_parts)})" if paren_parts else ""

    notes = ""
    if row["notes"]:
        notes = f" | {row['notes']}"

    return f"{date_cn} [{icon}{cat}] {content}{status_str}{paren}{notes}"


def retain(content, timestamp, tags=None, dry_run=False):
    """Call MemoMind retain API."""
    if dry_run:
        return {"status": "dry-run"}

    item = {
        "content": content,
        "timestamp": timestamp,
        "context": "daylife-import",
    }
    if tags:
        item["tags"] = tags

    payload = {
        "items": [item],
        "async": True,
    }

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{MEMOMIND_API}/v1/default/banks/{BANK_ID}/memories",
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
    parser = argparse.ArgumentParser(description="Import DayLife into MemoMind (per-event)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    parser.add_argument("--from-date", default=None, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--to-date", default=None, help="End date (YYYY-MM-DD)")
    parser.add_argument("--db", default=DAYLIFE_DB, help="DayLife DB path")
    parser.add_argument("--delay", type=float, default=0.3, help="Delay between retain calls (seconds)")
    args = parser.parse_args()

    print(f"[DayLife → MemoMind] Reading from {args.db}")
    entries = get_entries(args.db, args.from_date, args.to_date)
    print(f"  Found {len(entries)} entries (one retain per event)")

    if not entries:
        print("  No entries to import.")
        return

    dates = sorted(set(row["date"] for row in entries))
    print(f"  Spanning {len(dates)} days ({dates[0]} to {dates[-1]})")
    print(f"  Will make {len(entries)} retain calls")
    if args.dry_run:
        print("  [DRY RUN - no data will be written]\n")

    success = 0
    failed = 0
    for i, row in enumerate(entries):
        content = format_event_content(row)
        date = row["date"]

        # Timestamp: use start_time if available, else noon
        if row["start_time"]:
            timestamp = f"{date}T{row['start_time']}:00+08:00"
        else:
            timestamp = f"{date}T12:00:00+08:00"

        cat = row["category"] or "未分类"
        tags = ["daylife", date[:4], cat]

        progress = f"[{i+1}/{len(entries)}]"

        if args.dry_run:
            print(f"  {progress} {content[:100]}")
            if i >= 10:
                print(f"  ... (showing first 10 of {len(entries)})")
                break
        else:
            result = retain(content, timestamp, tags)
            if "error" in result:
                print(f"  {progress} FAILED: {content[:60]} → {result}")
                failed += 1
            else:
                if (i + 1) % 100 == 0 or i == 0:
                    print(f"  {progress} OK: {content[:80]}")
                success += 1
            time.sleep(args.delay)

    print(f"\n[Done] Success: {success}, Failed: {failed}, Total events: {len(entries)}")


if __name__ == "__main__":
    main()
