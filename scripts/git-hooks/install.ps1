# Install personal-playbook git hooks + filter config to .git/
#
# **Recommended entry point**: scripts\git-hooks\install.cmd
#   — auto-detects pwsh (PowerShell 7+) or powershell (Windows 5.1 built-in)
#   — avoids "pwsh not found" pitfall when only built-in Windows PowerShell is available
#   — incident 2026-05-13: cowork session 踩到 pwsh 缺席 → install 失敗 → 後續 commit 連環卡
#
# Direct invocation (advanced):
#   powershell -ExecutionPolicy Bypass -File scripts\git-hooks\install.ps1    # 內建 PS 5.1（Windows 預設一定有）
#   pwsh -ExecutionPolicy Bypass -File scripts/git-hooks/install.ps1          # PS Core 7+（選裝）
#
# This script works under BOTH PS 5.1 and PS 7+ — body code is cross-version compatible.
#
# Installs:
#   1. pre-commit hook (commit-time null byte defense)
#   2. git config filter.strip-nul (add-time null byte defense, see .gitattributes)
#
# Re-run is safe (idempotent).
#
# See PROJECT_PLAYBOOK.md §3.12.5 for design rationale.
# See docs/decisions/2026-05-13_sandbox_host_git_lock.md for pwsh-fallback incident.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (git -C $ScriptDir rev-parse --show-toplevel)
$HooksDir = Join-Path $RepoRoot ".git/hooks"

if (-not (Test-Path $HooksDir)) {
    Write-Error "Hooks dir not found: $HooksDir"
    exit 1
}

# Step 1: Install hooks
$installed = 0
Get-ChildItem $ScriptDir -File | Where-Object {
    $_.Name -notin @("install.sh", "install.ps1", "install.cmd", "README.md")
} | ForEach-Object {
    $dst = Join-Path $HooksDir $_.Name
    Copy-Item $_.FullName $dst -Force
    Write-Host "Installed hook: $dst"
    $installed++
}

# Step 2: Configure git filter (Layer 2 defense, see .gitattributes)
Write-Host ""
Write-Host "Configuring filter.strip-nul (Layer 2 add-time defense)..."
git -C $RepoRoot config filter.strip-nul.clean "tr -d '\000'"
git -C $RepoRoot config filter.strip-nul.smudge cat
# Not setting filter.strip-nul.required — missing config = identity passthrough = safe default
Write-Host "  filter.strip-nul.clean  = tr -d '\000'"
Write-Host "  filter.strip-nul.smudge = cat"

Write-Host ""
Write-Host "Done. $installed hook(s) installed + filter configured."
Write-Host ""
Write-Host "Test hook (commit-time):"
Write-Host "  ""a`0b"" | Out-File -Encoding utf8 test.md -NoNewline; git add test.md; git commit -m 'test'"
Write-Host ""
Write-Host "Optional: re-stage existing files to apply filter retroactively:"
Write-Host "  git add --renormalize ."
