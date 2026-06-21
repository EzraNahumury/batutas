# Registers a Windows Scheduled Task that runs the deposit tick once per day.
# Run this once, in a terminal with rights to create scheduled tasks. The machine
# must be powered on at trigger time.

$taskName = "BatutasCronTick"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$wrapper = Join-Path $dir "run-tick.ps1"
$action = "powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$wrapper`""

# 1 run/day at 15:00 = 500 local wallets deposit once. With the 100 old wallets
# already running in GitHub Actions, total unique addresses/day = 600 (DAU 600).
# Extra runs reuse the same wallets (no new DAU), only burn gas.
schtasks /Create /TN $taskName /TR $action /SC DAILY /ST 15:00 /F

Write-Host ""
Write-Host "Registered '$taskName' - runs daily 15:00 (500 local wallets; +100 cloud = DAU 600)."
Write-Host "Run now to test:   schtasks /Run /TN $taskName"
Write-Host "Inspect:           schtasks /Query /TN $taskName /V /FO LIST"
Write-Host "Remove:            schtasks /Delete /TN $taskName /F"
Write-Host "Logs:              $(Join-Path $dir 'logs\tick.log')"
