# Wrapper invoked by Windows Task Scheduler. Runs one deposit tick and appends
# all output (stdout + stderr) to logs\tick.log with a timestamped header.

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $dir

$logDir = Join-Path $dir "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log = Join-Path $logDir "tick.log"

"==== tick $(Get-Date -Format o) ====" | Out-File -FilePath $log -Append -Encoding utf8
node tick.js *>> $log
"exit code: $LASTEXITCODE" | Out-File -FilePath $log -Append -Encoding utf8
