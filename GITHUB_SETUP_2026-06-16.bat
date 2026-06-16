@echo off
REM ============================================================
REM vtuber-assistant : ONE-TIME GitHub backup setup (run on Windows)
REM   - cleans any partial .git left by the sandbox
REM   - git init + install null-byte hooks/filter + first commit
REM   - add remotes (origin=seyen37, backup=seyenbot) + push
REM All-ASCII; CRLF. Run this ONCE, then use GIT_COMMIT_PUSH_*.bat for future syncs.
REM
REM ONE-TIME PREREQ: create EMPTY repos (NO README/gitignore/license) on BOTH:
REM   https://github.com/new  -> seyen37/vtuber-assistant   (Public)
REM   https://github.com/new  -> seyenbot/vtuber-assistant  (Private, backup)
REM   SSH host alias "github-backup" must exist in %USERPROFILE%\.ssh\config
REM ============================================================

cd /d "C:\Users\USER\Documents\Cowork\VTube"

echo.
echo === Step 0: Remove any partial/broken .git from the sandbox ===
if exist ".git" (
    rmdir /s /q ".git"
    echo Old .git removed.
) else (
    echo No existing .git.
)

echo.
echo === Step 1: git init (branch main) ===
git init
git branch -M main
git config user.name "seyen37"
git config user.email "seyen37@users.noreply.github.com"
git config core.autocrlf false

echo.
echo === Step 2: Install null-byte defenses (hook + strip-nul filter) ===
call scripts\git-hooks\install.cmd
if errorlevel 1 echo [WARN] hook install reported an error; continuing.

echo.
echo === Step 3: First commit ===
git add -A
git commit -m "init: VTube desktop Live2D AI assistant + GitHub backup defenses" -m "Electron floating-window assistant: text Q&A + web-search agent + Live2D, switchable Ollama/OpenAI-compatible LLM. Null-byte defense Layers 1-3 mirrored from personal-playbook."
if errorlevel 1 goto :error

echo.
echo === Step 4: Add remotes ===
git remote get-url origin >nul 2>&1 || git remote add origin git@github.com:seyen37/vtuber-assistant.git
git remote get-url backup >nul 2>&1 || git remote add backup git@github-backup:seyenbot/vtuber-assistant.git
git remote -v

echo.
echo === Step 5: Push to origin (seyen37) ===
git push -u origin main
if errorlevel 1 goto :error_push

echo.
echo === Step 6: Push to backup (seyenbot) ===
git push -u backup main
if errorlevel 1 goto :error_push

echo.
echo === [SUCCESS] vtuber-assistant pushed to both remotes ===
git log --oneline -5
pause
exit /b 0

:error
echo.
echo [ERROR] Commit failed. See messages above.
pause
exit /b 1

:error_push
echo.
echo [ERROR] Push failed (commits are LOCAL and safe). Check:
echo   - both GitHub repos exist and are EMPTY?
echo   - network OK? SSH key loaded? "github-backup" alias in ~/.ssh/config?
pause
exit /b 2
