@echo off
echo 🚀 Building ThreatRecon Platform for Deployment...

REM Create dist directory
if not exist dist mkdir dist
if not exist dist\backend mkdir dist\backend
if not exist dist\frontend mkdir dist\frontend
if not exist dist\shared mkdir dist\shared

REM Copy backend files
echo 📦 Copying backend files...
xcopy /E /I /Y src\backend\src\* dist\backend\ >nul 2>&1
copy src\backend\package.json dist\backend\ >nul 2>&1
copy src\backend\tsconfig.json dist\backend\ >nul 2>&1

REM Copy frontend files
echo 📦 Copying frontend files...
xcopy /E /I /Y src\frontend\src\* dist\frontend\ >nul 2>&1
copy src\frontend\package.json dist\frontend\ >nul 2>&1
copy src\frontend\next.config.js dist\frontend\ >nul 2>&1
copy src\frontend\tailwind.config.js dist\frontend\ >nul 2>&1

REM Copy shared types
echo 📦 Copying shared types...
xcopy /E /I /Y src\shared\* dist\shared\ >nul 2>&1

REM Copy public files
echo 📦 Copying public files...
xcopy /E /I /Y public\* dist\ >nul 2>&1

REM Copy root files
echo 📦 Copying root files...
copy package.json dist\ >nul 2>&1
copy server.js dist\ >nul 2>&1
copy vercel.json dist\ >nul 2>&1

echo ✅ Build complete! Deployment files ready in dist/
echo 🌐 Ready for Vercel deployment
pause
