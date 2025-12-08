@echo off
echo === Checking Git Status ===
git status

echo.
echo === Staging All Changes ===
git add -A
git status --short

echo.
echo === Committing Changes ===
git commit -m "feat: Complete SOC platform transformation - massive event volumes and realistic alert queues"

echo.
echo === Checking Local Commits Not Pushed ===
git log origin/main..HEAD --oneline

echo.
echo === Pushing to GitHub ===
git push origin main

echo.
echo === Verifying Push ===
git fetch origin
git status

echo.
echo === DONE ===
echo Check GitHub: https://github.com/ThreatRec0n/threatrecon-site

pause

