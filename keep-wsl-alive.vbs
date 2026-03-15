Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "wsl -d Ubuntu -e bash -c ""sleep infinity""", 0, False
