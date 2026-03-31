' MemoMind Windows Native Startup (silent, no console window)
' Add to shell:startup for auto-start on login

Set WshShell = CreateObject("WScript.Shell")

' Start PostgreSQL if not running
WshShell.Run """D:\pythonPycharms\memomind-pg\pgsql\bin\pg_ctl.exe"" status -D ""D:\pythonPycharms\memomind-pg\data""", 0, True
If WshShell.Environment("Process")("errorlevel") <> "0" Then
    WshShell.Run """D:\pythonPycharms\memomind-pg\pgsql\bin\pg_ctl.exe"" start -D ""D:\pythonPycharms\memomind-pg\data"" -o ""-p 5433"" -l ""D:\pythonPycharms\memomind-pg\data\pg.log"" -w", 0, True
End If

' Clear socks proxy before starting (prevents OpenAI SDK 403 region error)
Dim env
Set env = WshShell.Environment("Process")
env.Remove "ALL_PROXY"
env.Remove "all_proxy"
env.Remove "HTTP_PROXY"
env.Remove "HTTPS_PROXY"
env.Remove "http_proxy"
env.Remove "https_proxy"

' Start MemoMind API server
WshShell.Run """D:\pythonPycharms\memomind-env\Scripts\pythonw.exe"" ""D:\pythonPycharms\memomind-env\serve.py""", 0, False

' Wait for API to be ready
WScript.Sleep 30000

' Start Dashboard
WshShell.Run """D:\pythonPycharms\memomind-env\Scripts\pythonw.exe"" ""D:\pythonPycharms\MemoMind\dashboard.py""", 0, False
