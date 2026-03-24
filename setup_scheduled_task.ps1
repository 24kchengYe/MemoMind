# ============================================================
#  Setup Windows Scheduled Task: MemoMind_DayLife_Sync
#  Run this script as Administrator (elevated PowerShell)
# ============================================================

$TaskName = "MemoMind_DayLife_Sync"
$BatPath  = "D:\pythonPycharms\MemoMind\sync_daylife.bat"

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "[OK] Removed existing task '$TaskName'"
}

# Action: run the bat script
$action = New-ScheduledTaskAction -Execute $BatPath -WorkingDirectory "D:\pythonPycharms\MemoMind"

# Trigger: daily at 03:00
$trigger = New-ScheduledTaskTrigger -Daily -At "03:00"

# Settings:
#   - StartWhenAvailable = if missed (PC was off), run as soon as possible
#   - AllowStartIfOnBatteries / DontStopIfGoingOnBatteries = run on laptop battery
#   - ExecutionTimeLimit = 1 hour max
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# Principal: run as current user, no need for highest privilege
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

# Register
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Daily sync DayLife records to MemoMind (03:00, with missed-run catch-up)"

Write-Host ""
Write-Host "=========================================="
Write-Host " Task '$TaskName' created successfully!"
Write-Host " Schedule: Daily at 03:00"
Write-Host " Missed runs: Will auto-run on next boot"
Write-Host "=========================================="
Write-Host ""

# Verify
Get-ScheduledTask -TaskName $TaskName | Format-List TaskName, State, Description
