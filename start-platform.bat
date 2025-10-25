@echo off
title ThreatRecon Platform Auto-Start

echo 🚀 ThreatRecon Platform Auto-Start
echo ==================================

echo.
echo 📊 Checking if server is already running...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ Server is already running'; Write-Host 'Status:' $response.StatusCode; exit 0 } catch { Write-Host '❌ Server is not running'; exit 1 }"

if %errorlevel% equ 0 (
    echo.
    echo 🎉 ThreatRecon Platform is already running!
    echo 🌐 Access at: http://localhost:3001
    echo 📊 Health check: http://localhost:3001/api/health
    echo.
    echo Press any key to start monitoring...
    pause > nul
    powershell -ExecutionPolicy Bypass -File "auto-monitor.ps1"
) else (
    echo.
    echo 🚀 Starting ThreatRecon Platform...
    
    echo 📦 Starting Node.js server...
    start "ThreatRecon Server" cmd /k "node server.js"
    
    echo ⏳ Waiting for server to start...
    timeout /t 5 /nobreak > nul
    
    echo 🔍 Testing server health...
    powershell -Command "for ($i=1; $i -le 10; $i++) { try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ Server started successfully!'; Write-Host 'Status:' $response.StatusCode; break } catch { Write-Host \"Attempt $i failed, retrying...\"; Start-Sleep 2 } }"
    
    if %errorlevel% equ 0 (
        echo.
        echo 🎉 ThreatRecon Platform is now running!
        echo 🌐 Frontend: http://localhost:3001
        echo 📊 Health check: http://localhost:3001/api/health
        echo 📄 Example AAR: http://localhost:3001/example-aar.html
        echo.
        echo 🔄 Starting auto-monitor...
        echo Press Ctrl+C to stop monitoring
        echo.
        powershell -ExecutionPolicy Bypass -File "auto-monitor.ps1"
    ) else (
        echo.
        echo ❌ Failed to start ThreatRecon Platform
        echo Please check the error messages above
        echo.
        pause
    )
)
