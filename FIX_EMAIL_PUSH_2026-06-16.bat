@echo off
REM ============================================================
REM Fix GH007 "push would publish a private email address".
REM Re-author the existing commit with the GitHub no-reply email, then push.
REM All-ASCII; CRLF.
REM
REM NOTE: this uses the generic no-reply form (push will succeed).
REM For commits to LINK to your GitHub profile, replace the email below with the
REM exact one from GitHub -> Settings -> Emails -> "Keep my email addresses private",
REM which looks like:  12345678+seyen37@users.noreply.github.com
REM ============================================================

cd /d "C:\Users\USER\Documents\Cowork\VTube"

echo.
echo === Set commit identity to GitHub no-reply ===
git config user.name "seyen37"
git config user.email "seyen37@users.noreply.github.com"

echo.
echo === Re-author the existing commit(s) ===
git commit --amend --reset-author --no-edit
if errorlevel 1 goto :error

echo.
echo === Push to origin (seyen37) ===
git push -u origin main
if errorlevel 1 goto :error_push

echo.
echo === Push to backup (seyenbot) ===
git push -u backup main
if errorlevel 1 goto :error_push

echo.
echo === [SUCCESS] pushed to both remotes ===
git log --oneline -3
pause
exit /b 0

:error
echo.
echo [ERROR] Amend failed. See messages above.
pause
exit /b 1

:error_push
echo.
echo [ERROR] Push still failing. If GH007 persists, your account may require the
echo         exact ID-form no-reply email. Get it from GitHub Settings -> Emails,
echo         then edit user.email in this bat and re-run.
pause
exit /b 2
