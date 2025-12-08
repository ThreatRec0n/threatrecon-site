# Git Push Script for SOC Platform Transformation
# Run this script in PowerShell: .\push-to-git.ps1

Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Staging All Changes ===" -ForegroundColor Cyan
git add -A
git status --short

Write-Host "`n=== Committing Changes ===" -ForegroundColor Cyan
git commit -m "feat: Complete SOC platform transformation - massive event volumes and realistic alert queues"

Write-Host "`n=== Checking Local Commits Not Pushed ===" -ForegroundColor Cyan
git log origin/main..HEAD --oneline

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main

Write-Host "`n=== Verifying Push ===" -ForegroundColor Cyan
git fetch origin
git status

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Check GitHub: https://github.com/ThreatRec0n/threatrecon-site" -ForegroundColor Yellow

