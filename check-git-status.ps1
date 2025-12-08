# Git Status Check Script
Write-Host "=== GIT STATUS ===" -ForegroundColor Cyan
$status = git status
Write-Host $status

Write-Host "`n=== GIT STATUS (SHORT) ===" -ForegroundColor Cyan
$shortStatus = git status --short
if ($shortStatus) {
    Write-Host $shortStatus
} else {
    Write-Host "No changes" -ForegroundColor Yellow
}

Write-Host "`n=== UNTRACKED FILES ===" -ForegroundColor Cyan
$untracked = git ls-files --others --exclude-standard
if ($untracked) {
    Write-Host $untracked
} else {
    Write-Host "No untracked files" -ForegroundColor Yellow
}

Write-Host "`n=== MODIFIED FILES ===" -ForegroundColor Cyan
$modified = git diff --name-only
if ($modified) {
    Write-Host $modified
} else {
    Write-Host "No modified files" -ForegroundColor Yellow
}

Write-Host "`n=== STAGED FILES ===" -ForegroundColor Cyan
$staged = git diff --cached --name-only
if ($staged) {
    Write-Host $staged
} else {
    Write-Host "No staged files" -ForegroundColor Yellow
}

Write-Host "`n=== CURRENT BRANCH ===" -ForegroundColor Cyan
git branch --show-current

Write-Host "`n=== RECENT COMMITS ===" -ForegroundColor Cyan
git log --oneline -3

Write-Host "`n=== COMMITS NOT PUSHED ===" -ForegroundColor Cyan
$unpushed = git log origin/main..HEAD --oneline
if ($unpushed) {
    Write-Host $unpushed
} else {
    Write-Host "No unpushed commits" -ForegroundColor Yellow
}

