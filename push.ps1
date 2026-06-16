#requires -Version 5
<#
  push.ps1 - Commit all changes in THIS repo and push to origin (+ backup if present).

  Run:
    Right-click this file  ->  "Run with PowerShell"
    or in a terminal:
      powershell -ExecutionPolicy Bypass -File .\push.ps1
      powershell -ExecutionPolicy Bypass -File .\push.ps1 -Message "your message"

  Notes:
    - Locates its own repo via $PSScriptRoot, so it works no matter where you launch it.
    - Pushes branch 'main' to 'origin' and (if configured) 'backup'.
#>
param(
  [string]$Message = ("backup: sync " + (Get-Date -Format "yyyy-MM-dd HH:mm"))
)

Set-Location -LiteralPath $PSScriptRoot
Write-Host "=== Repo: $PSScriptRoot ===" -ForegroundColor Cyan

# 0) Remove stale git lock (Cowork mount can leave one behind)
$lock = Join-Path $PSScriptRoot ".git\index.lock"
if (Test-Path $lock) { Remove-Item -Force $lock; Write-Host "Removed stale index.lock" }

# 1) Stage everything
git add -A

# 2) Show what will be committed
Write-Host ""
Write-Host "=== Changes to commit ===" -ForegroundColor Cyan
git status --short

# 3) Commit (native non-zero like 'nothing to commit' won't abort the script)
Write-Host ""
Write-Host "=== Commit ===" -ForegroundColor Cyan
git commit -m $Message

# 4) Push origin
Write-Host ""
Write-Host "=== Push origin ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "[WARN] push origin failed (commits are local & safe)." -ForegroundColor Yellow }

# 5) Push backup if the remote exists
$remotes = git remote
if ($remotes -contains "backup") {
  Write-Host ""
  Write-Host "=== Push backup ===" -ForegroundColor Cyan
  git push backup main
  if ($LASTEXITCODE -ne 0) { Write-Host "[WARN] push backup failed." -ForegroundColor Yellow }
} else {
  Write-Host "No 'backup' remote configured; skipped." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== Recent commits ===" -ForegroundColor Cyan
git log --oneline -3

Write-Host ""
Read-Host "Press Enter to close"
