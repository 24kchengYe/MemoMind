"""
Import DayLife records into MemoMind's 'life' bank.
Reads SQLite directly, calls MemoMind retain API in batches.

Usage: python import_daylife.py [--dry-run] [--batch-size 20] [--from 2024-01-01] [--to 2026-12-31]
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
from datetime import datetime

# Fix Windows console encoding for emoji
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Config
DAYLIFE_DB = os.path.expanduser("~/.local/share/daylife/daylife.db")
MEMOMIND_API = "http://127.0.0.1:18888"
BANK_ID = "life"
BATCH_SIZE = 20  # entries per batch (one retain call per batch)

# Disable proxy
for k in ["ALL_PROXY", "all_proxy", "HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy"]:
    os.environ.pop(k, None)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def get_entries(db_path, date_from=None, date_to=None):
    """Read all entries from DayLife SQLite DB."""
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    query = """
        SELECT e.date, c.icon, c.name as category, e.content, e.status,
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


def format_entry(row):
    """Format a single entry into a concise string."""
    icon = row["icon"] or ""
    cat = row["category"] or "未分类"
    content = row["content"] or ""
    status = row["status"] or ""

    time_str = ""
    if row["start_time"] and row["end_time"]:
        time_str = f" {row['start_time']}-{row['end_time']}"
    elif row["start_time"]:
        time_str = f" {row['start_time']}"

    dur_str = ""
    if row["duration_minutes"]:
        dur_str = f" ({row['duration_minutes']}min)"

    status_mark = ""
    if status == "completed":
        status_mark = " ✓"
    elif status == "incomplete":
        status_mark = " ✗"

    notes = ""
    if row["notes"]:
        notes = f" | {row['notes']}"

    return f"[{icon}{cat}] {content}{status_mark}{time_str}{dur_str}{notes}"


def group_by_date(entries):
    """Group entries by date, return dict of date -> [formatted_entries]."""
    grouped = {}
    for row in entries:
        date = row["date"]
        if date not in grouped:
            grouped[date] = []
        grouped[date].append(format_entry(row))
    return grouped


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
    parser = argparse.ArgumentParser(description="Import DayLife into MemoMind")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Entries per retain call")
    parser.add_argument("--from-date", default=None, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--to-date", default=None, help="End date (YYYY-MM-DD)")
    parser.add_argument("--db", default=DAYLIFE_DB, help="DayLife DB path")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between retain calls (seconds)")
    args = parser.parse_args()

    print(f"[DayLife → MemoMind] Reading from {args.db}")
    entries = get_entries(args.db, args.from_date, args.to_date)
    print(f"  Found {len(entries)} entries")

    if not entries:
        print("  No entries to import.")
        return

    # Group by date
    by_date = group_by_date(entries)
    print(f"  Spanning {len(by_date)} days ({min(by_date.keys())} to {max(by_date.keys())})")

    # Build batches: group consecutive dates into chunks
    dates = sorted(by_date.keys())
    batches = []
    current_batch = []
    current_dates = []

    for date in dates:
        current_batch.extend(by_date[date])
        current_dates.append(date)
        if len(current_batch) >= args.batch_size:
            batches.append((current_dates[0], current_dates[-1], current_batch))
            current_batch = []
            current_dates = []

    if current_batch:
        batches.append((current_dates[0], current_dates[-1], current_batch))

    print(f"  Grouped into {len(batches)} batches (batch_size={args.batch_size})")
    if args.dry_run:
        print("  [DRY RUN - no data will be written]\n")

    # Import batches
    success = 0
    failed = 0
    for i, (date_from, date_to, items) in enumerate(batches):
        # Format batch content
        # Re-group items by date for readable output
        content_lines = []
        current_date = None
        item_idx = 0
        for date in sorted(by_date.keys()):
            if date < date_from or date > date_to:
                continue
            date_entries = by_date[date]
            content_lines.append(f"## {date}")
            for entry_text in date_entries:
                content_lines.append(f"- {entry_text}")

        content = "\n".join(content_lines)

        # Use middle date as timestamp
        timestamp = f"{date_from}T12:00:00+08:00"

        # Extract category tags from content
        tags = ["daylife"]
        if date_from[:4] == date_to[:4]:
            tags.append(date_from[:4])  # year tag

        progress = f"[{i+1}/{len(batches)}]"
        print(f"  {progress} {date_from} ~ {date_to} ({len(items)} entries)", end="")

        if args.dry_run:
            print(f" → DRY RUN")
            if i < 3:  # Show first 3 batches content
                print(f"    Preview:\n{content[:300]}...")
        else:
            result = retain(content, timestamp, tags)
            if "error" in result:
                print(f" → FAILED: {result}")
                failed += 1
            else:
                print(f" → OK ({result.get('status', 'unknown')})")
                success += 1
            time.sleep(args.delay)

    print(f"\n[Done] Success: {success}, Failed: {failed}, Total batches: {len(batches)}")


if __name__ == "__main__":
    main()
