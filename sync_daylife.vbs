' MemoMind DayLife Sync - Windowless launcher
' Runs sync_daylife_smart.py via pythonw.exe (no console window)
' Python script writes its own log to sync_daylife.log
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\pythonPycharms\MemoMind"
WshShell.Environment("PROCESS")("HTTP_PROXY") = ""
WshShell.Environment("PROCESS")("HTTPS_PROXY") = ""
WshShell.Environment("PROCESS")("ALL_PROXY") = ""
' intWindowStyle=0 hidden, bWaitOnReturn=True
WshShell.Run """D:\pythonPycharms\memomind-env\Scripts\pythonw.exe"" -X utf8 ""D:\pythonPycharms\MemoMind\sync_daylife_smart.py""", 0, True
