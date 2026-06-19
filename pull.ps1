#requires -Version 5
<#
  pull.ps1 - Fetch and fast-forward THIS repo from origin, then report what changed.

  Run:
    Right-click this file  ->  "Run with PowerShell"
    or in a terminal:
      powershell -ExecutionPolicy Bypass -File .\pull.ps1

  Notes:
    - Locates its own repo via $PSScriptRoot, so it works no matter where you launch it.
    - Pulls branch 'main' from 'origin' with --ff-only (no surprise merge commits).
    - If you have local un-pushed commits/changes, run push.ps1 first.
#>

Set-Location -LiteralPath $PSScriptRoot
Write-Host "=== Repo: $PSScriptRoot ===" -ForegroundColor Cyan

# 0) Remove stale git lock (Cowork mount can leave one behind)
$lock = Join-Path $PSScriptRoot ".git\index.lock"
if (Test-Path $lock) { Remove-Item -Force $lock; Write-Host "Removed stale index.lock" }

# 1) Warn if working tree has uncommitted changes
$dirty = git status --short
if ($dirty) {
  Write-Host ""
  Write-Host "=== Local uncommitted changes (not yet backed up) ===" -ForegroundColor Yellow
  git status --short
  Write-Host "Tip: run push.ps1 first if you want to keep these. Continuing with --ff-only pull..." -ForegroundColor DarkGray
}

# 2) Remember where we are
$before = (git rev-parse HEAD).Trim()

# 3) Pull (fast-forward only -> safe, never creates a merge commit)
Write-Host ""
Write-Host "=== Pull origin main (--ff-only) ===" -ForegroundColor Cyan
git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "[WARN] Fast-forward pull failed - local & remote likely diverged." -ForegroundColor Yellow
  Write-Host "       Run push.ps1 to back up local commits, then re-run pull.ps1; or resolve manually." -ForegroundColor Yellow
  Write-Host ""
  Read-Host "Press Enter to close"
  exit 1
}

$after = (git rev-parse HEAD).Trim()

# 4) Report what changed
Write-Host ""
if ($before -eq $after) {
  Write-Host "=== Already up to date ===" -ForegroundColor Green
} else {
  Write-Host ("=== Downloaded updates: " + $before.Substring(0,7) + ".." + $after.Substring(0,7) + " ===") -ForegroundColor Green
  Write-Host ""
  Write-Host "--- New commits ---" -ForegroundColor Cyan
  git --no-pager log --oneline "$before..$after"
  Write-Host ""
  Write-Host "--- Files changed ---" -ForegroundColor Cyan
  git --no-pager diff --stat "$before..$after"
}

Write-Host ""
Read-Host "Press Enter to close"
