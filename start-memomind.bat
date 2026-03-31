@echo off
:: MemoMind Windows Native Startup Script
:: Starts PostgreSQL 17 + MemoMind API server + Dashboard

set PG_BIN=D:\pythonPycharms\memomind-pg\pgsql\bin
set PG_DATA=D:\pythonPycharms\memomind-pg\data
set PYTHON=D:\pythonPycharms\memomind-env\Scripts\pythonw.exe
set MEMOMIND_DIR=D:\pythonPycharms\MemoMind
set MEMOMIND_ENV=D:\pythonPycharms\memomind-env

:: Start PostgreSQL if not running
"%PG_BIN%\pg_ctl.exe" status -D "%PG_DATA%" >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL 17 on port 5433...
    "%PG_BIN%\pg_ctl.exe" start -D "%PG_DATA%" -o "-p 5433" -l "%PG_DATA%\pg.log" -w
)

:: Clear socks proxy (prevents OpenAI SDK from using socks5 instead of http proxy)
set ALL_PROXY=
set all_proxy=
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=

:: Start MemoMind API server (background)
echo Starting MemoMind API server...
start /B "" "%PYTHON%" "%MEMOMIND_ENV%\serve.py"

:: Start Dashboard proxy (background)
echo Starting Dashboard on port 9999...
start /B "" "%PYTHON%" "%MEMOMIND_DIR%\dashboard.py"

echo MemoMind started. API: http://localhost:19999  Dashboard: http://localhost:9999
