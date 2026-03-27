@echo off
REM ============================================================
REM  MemoMind DayLife Daily Sync
REM  Scheduled to run at 03:00 Beijing Time (UTC+8) daily
REM  Syncs all DayLife records since last successful sync.
REM  Handles missed days (e.g., computer was off for a week).
REM ============================================================

REM Clear proxy env vars
set HTTP_PROXY=
set HTTPS_PROXY=
set ALL_PROXY=
set http_proxy=
set https_proxy=
set all_proxy=

cd /d D:\pythonPycharms\MemoMind
python D:\pythonPycharms\MemoMind\sync_daylife_smart.py >> sync_daylife.log 2>&1
