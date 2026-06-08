<#
.SYNOPSIS
    Generate many commits + pull requests in one run by tweaking
    documentation/README.md and frontend-batutas/test.css.

.DESCRIPTION
    Creates $PrCount feature branches. Each branch gets $CommitsPerPr commits
    that rotate the CSS theme colors and append a changelog entry.
    Each branch is pushed and opened as a PR. By default every PR is merged
    into the base branch (so the commits land on the contribution graph),
    re-syncing the base branch after each merge to keep history linear.

    Defaults: 25 PRs * 4 commits = 100 commits.

.EXAMPLE
    # Preview locally, no push / no PR (safe):
    ./generate-commits.ps1 -DryRun

.EXAMPLE
    # Real run: 100 commits + 25 PRs, merged into main:
    ./generate-commits.ps1

.EXAMPLE
    # Open PRs but do NOT merge them:
    ./generate-commits.ps1 -NoMerge
#>
[CmdletBinding()]
param(
    [int]$PrCount        = 25,
    [int]$CommitsPerPr   = 4,
    [string]$BaseBranch  = "main",
    [string]$BranchPrefix= "auto/update",
    [ValidateSet("merge","squash","rebase")]
    [string]$MergeStrategy = "merge",
    [switch]$NoMerge,
    [switch]$DryRun,
    [int]$DelayMs = 1500
)

$ErrorActionPreference = "Stop"

# --- paths ---------------------------------------------------------------
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot
$CssFile    = Join-Path $RepoRoot "frontend-batutas\test.css"
$ReadmeFile = Join-Path $RepoRoot "documentation\README.md"

# --- tiny helpers --------------------------------------------------------
function Run-Git {
    param([Parameter(ValueFromRemainingArguments = $true)]$Args)
    & git @Args
    if ($LASTEXITCODE -ne 0) { throw "git $($Args -join ' ') failed (exit $LASTEXITCODE)" }
}

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    $msg" -ForegroundColor Yellow }

function New-Hex { '#{0:x6}' -f (Get-Random -Maximum 0xFFFFFF) }

$MsgTypes = @(
    "style: tweak theme palette",
    "docs: update changelog entry",
    "chore: refresh design tokens",
    "style: adjust accent color",
    "docs: note theme change",
    "refactor: bump css variables",
    "style: restyle button hover",
    "chore: rotate color scheme"
)

function Update-Files {
    param([string]$Note)
    # rotate CSS colors
    $primary = New-Hex; $accent = New-Hex; $bg = New-Hex
    $css = [IO.File]::ReadAllText($CssFile)
    $css = $css -replace '(--primary:\s*)#[0-9a-fA-F]{3,6};', ('${1}' + $primary + ';')
    $css = $css -replace '(--accent:\s*)#[0-9a-fA-F]{3,6};',  ('${1}' + $accent  + ';')
    $css = $css -replace '(--bg:\s*)#[0-9a-fA-F]{3,6};',      ('${1}' + $bg      + ';')
    [IO.File]::WriteAllText($CssFile, $css)

    # append changelog line in README
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $entry = "- $stamp - $Note (primary=$primary accent=$accent bg=$bg)`n"
    $md = [IO.File]::ReadAllText($ReadmeFile)
    $md = $md -replace '<!-- changelog:end -->', ($entry + '<!-- changelog:end -->')
    [IO.File]::WriteAllText($ReadmeFile, $md)
}

# --- pre-flight ----------------------------------------------------------
Write-Step "Pre-flight checks"

Run-Git rev-parse --is-inside-work-tree | Out-Null

# working tree must be clean so branches are created from a known state
$dirty = & git status --porcelain
if ($dirty) {
    throw "Working tree not clean. Commit or stash changes first:`n$dirty"
}

if (-not (Test-Path $CssFile))    { throw "Missing $CssFile" }
if (-not (Test-Path $ReadmeFile)) { throw "Missing $ReadmeFile" }

if (-not $DryRun) {
    & gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "gh not authenticated. Run: gh auth login" }
}

Write-Ok "repo: $RepoRoot"
Write-Ok "base branch: $BaseBranch"
Write-Ok ("plan: {0} PRs x {1} commits = {2} commits" -f $PrCount, $CommitsPerPr, ($PrCount * $CommitsPerPr))
if ($DryRun)  { Write-Warn2 "DRY RUN - no push, no PR, no merge" }
if ($NoMerge) { Write-Warn2 "NoMerge - PRs will be opened but NOT merged" }

Run-Git checkout $BaseBranch
if (-not $DryRun) {
    & git pull --ff-only origin $BaseBranch
    if ($LASTEXITCODE -ne 0) { Write-Warn2 "could not pull $BaseBranch (continuing with local state)" }
}

# --- main loop -----------------------------------------------------------
$runId      = Get-Date -Format 'yyyyMMddHHmmss'
$prsCreated = 0
$prsMerged  = 0
$commits    = 0
$prUrls     = @()

for ($i = 1; $i -le $PrCount; $i++) {
    $num    = '{0:D2}' -f $i
    $branch = "$BranchPrefix-$runId-$num"

    Write-Step "PR $i / $PrCount  ($branch)"

    Run-Git checkout $BaseBranch
    Run-Git checkout -b $branch

    for ($c = 1; $c -le $CommitsPerPr; $c++) {
        $note = $MsgTypes | Get-Random
        Update-Files -Note "$note [pr $num #$c]"
        Run-Git add -- $CssFile $ReadmeFile
        Run-Git commit -m "$note ($num/$c)"
        $commits++
    }
    Write-Ok "$CommitsPerPr commits"

    if ($DryRun) {
        Run-Git checkout $BaseBranch
        Write-Warn2 "dry run: branch kept locally, not pushed"
        continue
    }

    Run-Git push -u origin $branch
    Write-Ok "pushed"

    $title = "Auto update $num - theme + docs"
    $body  = "Automated update: rotated CSS theme tokens and appended changelog entries.`n`n- branch: $branch`n- commits: $CommitsPerPr"
    $prUrl = & gh pr create --base $BaseBranch --head $branch --title $title --body $body
    if ($LASTEXITCODE -ne 0) { throw "gh pr create failed for $branch" }
    $prsCreated++
    $prUrls += $prUrl
    Write-Ok "PR created: $prUrl"

    # leave the branch before deleting it on merge
    Run-Git checkout $BaseBranch

    if (-not $NoMerge) {
        try {
            & gh pr merge $branch "--$MergeStrategy" --delete-branch
            if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
            $prsMerged++
            Write-Ok "merged ($MergeStrategy)"
            & git pull --ff-only origin $BaseBranch | Out-Null
        }
        catch {
            Write-Warn2 "merge failed for $branch ($_). PR left open."
        }
    }

    Start-Sleep -Milliseconds $DelayMs
}

# --- summary -------------------------------------------------------------
Write-Step "Done"
Write-Ok "commits made : $commits"
if (-not $DryRun) {
    Write-Ok "PRs created  : $prsCreated"
    Write-Ok "PRs merged   : $prsMerged"
    if ($prUrls.Count) {
        Write-Host ""
        Write-Host "Pull requests:" -ForegroundColor Cyan
        $prUrls | ForEach-Object { Write-Host "  $_" }
    }
} else {
    Write-Warn2 "dry run complete. Inspect branches with: git branch --list '$BranchPrefix-*'"
    Write-Warn2 "delete them with: git branch --list '$BranchPrefix-*' | % { git branch -D `$_.Trim() }"
}
