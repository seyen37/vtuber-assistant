@echo off
REM Auto-detect PowerShell flavor and run install.ps1 — Windows entry point.
REM
REM Usage from repo root:
REM   scripts\git-hooks\install.cmd
REM
REM Detection order:
REM   1. pwsh   (PowerShell Core 7+, if installed)
REM   2. powershell (built-in Windows PowerShell 5.1, always present)
REM
REM Background: 2026-05-13 incident — pwsh missing in PATH caused install.ps1
REM   silent failure, cascaded into git index.lock stale state, blocked subsequent
REM   git operations. See docs/decisions/2026-05-13_sandbox_host_git_lock.md.

setlocal
set "SCRIPT_DIR=%~dp0"

where pwsh >nul 2>&1
if %errorlevel%==0 (
    echo [install.cmd] Using pwsh ^(PowerShell 7+^)
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1" %*
    exit /b %errorlevel%
)

where powershell >nul 2>&1
if %errorlevel%==0 (
    echo [install.cmd] Using powershell ^(built-in PS 5.1^)
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install.ps1" %*
    exit /b %errorlevel%
)

echo [install.cmd] Error: neither pwsh nor powershell found in PATH. 1>&2
exit /b 1
