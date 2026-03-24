@echo off
REM ============================================================
REM  MemoMind DayLife Daily Sync
REM  Scheduled to run at 03:00 Beijing Time (UTC+8) daily
REM  Computes YESTERDAY and TODAY dynamically, then calls
REM  import_daylife.py to sync DayLife records into MemoMind.
REM ============================================================

REM Clear proxy env vars to avoid connection issues
set HTTP_PROXY=
set HTTPS_PROXY=
set ALL_PROXY=
set http_proxy=
set https_proxy=
set all_proxy=

REM Change to project directory
cd /d D:\pythonPycharms\MemoMind

REM Log header
echo ============================================================ >> sync_daylife.log
echo [%date% %time%] DayLife Sync starting... >> sync_daylife.log

REM Compute TODAY (YYYY-MM-DD)
for /f "tokens=*" %%a in ('python -c "from datetime import date; print(date.today().isoformat())"') do set TODAY=%%a

REM Compute YESTERDAY (YYYY-MM-DD)
for /f "tokens=*" %%a in ('python -c "from datetime import date,timedelta; print((date.today()-timedelta(days=1)).isoformat())"') do set YESTERDAY=%%a

echo [%date% %time%] Syncing from %YESTERDAY% to %TODAY% >> sync_daylife.log

REM Run the import script
python D:\pythonPycharms\MemoMind\import_daylife.py --from-date %YESTERDAY% --to-date %TODAY% --batch-size 50 >> sync_daylife.log 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Sync completed successfully. >> sync_daylife.log
) else (
    echo [%date% %time%] Sync FAILED with exit code %ERRORLEVEL%. >> sync_daylife.log
)

echo ============================================================ >> sync_daylife.log
