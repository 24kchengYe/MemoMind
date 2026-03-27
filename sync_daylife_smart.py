"""
Smart DayLife sync: only imports events after the last successful sync date.
Handles missed days gracefully (e.g., computer was off for a week).

Uses a marker file (sync_daylife_last.txt) to track the last synced date.
"""
import os
import sys
import io
import subprocess
from datetime import date, timedelta

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
MARKER_FILE = os.path.join(PROJECT_DIR, "sync_daylife_last.txt")
IMPORT_SCRIPT = os.path.join(PROJECT_DIR, "import_daylife.py")


def get_last_sync_date():
    """Read the last successfully synced date from marker file."""
    if os.path.exists(MARKER_FILE):
        with open(MARKER_FILE, "r") as f:
            text = f.read().strip()
            if text:
                return text
    return None


def save_last_sync_date(d):
    """Save the last synced date to marker file."""
    with open(MARKER_FILE, "w") as f:
        f.write(d)


def main():
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    last_sync = get_last_sync_date()

    if last_sync and last_sync >= yesterday:
        print(f"[{date.today()}] Already synced up to {last_sync}, nothing to do.")
        return

    # Sync from the day after last sync, up to yesterday
    if last_sync:
        # Parse and add one day to avoid re-importing the last synced date
        from datetime import datetime
        last_dt = datetime.strptime(last_sync, "%Y-%m-%d").date()
        from_date = (last_dt + timedelta(days=1)).isoformat()
    else:
        # No marker file — first run after setup, only sync yesterday
        from_date = yesterday

    to_date = yesterday

    if from_date > to_date:
        print(f"[{date.today()}] No new dates to sync (from={from_date} > to={to_date}).")
        return

    print(f"[{date.today()}] Syncing DayLife from {from_date} to {to_date}")

    result = subprocess.run(
        [sys.executable, IMPORT_SCRIPT, "--from-date", from_date, "--to-date", to_date, "--delay", "0.3"],
        cwd=PROJECT_DIR,
    )

    if result.returncode == 0:
        save_last_sync_date(to_date)
        print(f"[{date.today()}] Sync completed. Marker updated to {to_date}.")
    else:
        print(f"[{date.today()}] Sync FAILED (exit code {result.returncode}). Marker NOT updated.")


if __name__ == "__main__":
    main()
