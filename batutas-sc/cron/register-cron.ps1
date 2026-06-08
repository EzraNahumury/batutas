# Registers a Windows Scheduled Task that runs the deposit tick every 288 minutes
# (4h48m => 5x/day). Run this once, in a terminal with rights to create scheduled
# tasks. The machine must be powered on at trigger time.

$taskName = "BatutasCronTick"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$wrapper = Join-Path $dir "run-tick.ps1"
$action = "powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$wrapper`""

# 1440 min/day / 288 = 5 runs/day = 500 tx/day (100 wallets x 1 deposit each).
schtasks /Create /TN $taskName /TR $action /SC MINUTE /MO 288 /ST 00:00 /F

Write-Host ""
Write-Host "Registered '$taskName' - runs every 288 min (5x/day = 500 tx/day)."
Write-Host "Run now to test:   schtasks /Run /TN $taskName"
Write-Host "Inspect:           schtasks /Query /TN $taskName /V /FO LIST"
Write-Host "Remove:            schtasks /Delete /TN $taskName /F"
Write-Host "Logs:              $(Join-Path $dir 'logs\tick.log')"
