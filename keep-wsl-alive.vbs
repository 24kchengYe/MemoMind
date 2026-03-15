Set WshShell = CreateObject("WScript.Shell")

' === MemoMind Windows Startup Script ===
' Copy this file to: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\
' Then edit the MEMO_DIR path below to match where you cloned MemoMind.

Dim MEMO_DIR
MEMO_DIR = "D:\pythonPycharms\MemoMind"  ' <-- CHANGE THIS to your MemoMind clone path

' 1. Keep WSL alive
WshShell.Run "wsl -d Ubuntu -e bash -c ""sleep infinity""", 0, False

' 2. Wait for WSL to start, then update port forwarding (needs admin)
WScript.Sleep 10000
WshShell.Run "powershell -ExecutionPolicy Bypass -Command ""Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File " & MEMO_DIR & "\update-portproxy.ps1' -Verb RunAs""", 0, False

' 3. Start proxy bridge (only needed for Mode B / international APIs)
' WshShell.Run "pythonw " & MEMO_DIR & "\proxy-bridge.py", 0, False

' 4. Start MemoMind Dashboard
WScript.Sleep 5000
WshShell.Run "pythonw " & MEMO_DIR & "\dashboard.py", 0, False
