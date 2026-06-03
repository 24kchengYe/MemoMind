# Create MemoMind-DayLife-Sync scheduled task
# Runs sync_daylife.vbs every day at 03:00, hidden
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument '"D:\pythonPycharms\MemoMind\sync_daylife.vbs"'
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
$settings = New-ScheduledTaskSettingsSet -Hidden -StartWhenAvailable -RunOnlyIfNetworkAvailable:$false -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName "MemoMind-DayLife-Sync" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
Write-Output "Task created successfully"
