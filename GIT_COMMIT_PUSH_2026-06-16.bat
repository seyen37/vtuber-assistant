@echo off
REM ============================================================
REM vtuber-assistant : commit + push to GitHub
REM   origin = seyen37, backup = seyenbot  (mirrors personal-playbook)
REM All-ASCII; CRLF line endings. Safe to re-run.
REM
REM ONE-TIME PREREQ: create EMPTY repos (NO README/gitignore/license) on BOTH:
REM   https://github.com/new  -> seyen37/vtuber-assistant   (Public)
REM   https://github.com/new  -> seyenbot/vtuber-assistant  (Private, backup)
REM   SSH host alias "github-backup" must exist in %USERPROFILE%\.ssh\config
REM ============================================================

cd /d "C:\Users\USER\Documents\Cowork\VTube"

echo.
echo === Step 0: Remove stale .git\index.lock ===
if exist ".git\index.lock" ( del /F /Q ".git\index.lock" & echo Lock removed. ) else ( echo No stale lock. )

echo.
echo === Step 1: Ensure remotes ===
git remote get-url origin >nul 2>&1 || git remote add origin git@github.com:seyen37/vtuber-assistant.git
git remote get-url backup >nul 2>&1 || git remote add backup git@github-backup:seyenbot/vtuber-assistant.git
git remote -v

echo.
echo === Step 2: Stage + commit any changes ===
git add -A
git commit -m "chore: sync VTube desktop assistant backup" -m "Synced from Cowork working folder."

echo.
echo === Step 3: Push to origin (seyen37) ===
git push -u origin main
if errorlevel 1 goto :error_push

echo.
echo === Step 4: Push to backup (seyenbot) ===
git push -u backup main
if errorlevel 1 goto :error_push

echo.
echo === [SUCCESS] pushed to both remotes ===
git log --oneline -5
pause
exit /b 0

:error_push
echo.
echo [ERROR] Push failed. Commits are local. Check: do both GitHub repos exist?
echo         network OK? SSH key loaded? "github-backup" alias configured?
pause
exit /b 2
