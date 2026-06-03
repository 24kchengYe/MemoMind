' MemoMind Windows Native Startup (silent, no console window)
' Purpose: Start portable PostgreSQL 17 on port 5433.
' NSSM services (MemoMind-API / MemoMind-Web / MemoMind-Vault) auto-start
' separately and will pick up PG17 as soon as it is ready.
'
' The .bat and .vbs variants ran serve.py/dashboard.py/NoteDiscovery directly,
' which conflicts with the NSSM services. This version only owns PG17.
'
' Hidden-window convention: WshShell.Run(command, 0, wait) — the `0` flag
' means SW_HIDE, so nothing flashes on screen.

Const PG_BIN  = "D:\pythonPycharms\memomind-pg\pgsql\bin"
Const PG_DATA = "D:\pythonPycharms\memomind-pg\data"
Const STALE_PID = "D:\pythonPycharms\memomind-pg\data\postmaster.pid"

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' 1. Is PG17 already running? If so, nothing to do.
rc = WshShell.Run("""" & PG_BIN & "\pg_ctl.exe"" status -D """ & PG_DATA & """", 0, True)
If rc = 0 Then
    WScript.Quit 0
End If

' 2. Clean up a stale postmaster.pid left behind by an unclean shutdown
'    (power loss, hard reboot). pg_ctl refuses to start when this file
'    points at a PID that is no longer alive, so we delete it unconditionally
'    — we already confirmed PG is not running via pg_ctl status above.
If fso.FileExists(STALE_PID) Then
    On Error Resume Next
    fso.DeleteFile STALE_PID, True
    On Error Goto 0
End If

' 3. Start PG17 on port 5433, wait until it accepts connections.
WshShell.Run "cmd /c """"" & PG_BIN & "\pg_ctl.exe"" start -D """ & PG_DATA & """ -o ""-p 5433"" -l """ & PG_DATA & "\pg.log"" -w""", 0, True
