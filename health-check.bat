@echo off
echo 🔍 ThreatRecon Platform Health Check
echo ==================================

echo.
echo 📊 Checking local server...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing; Write-Host '✅ Local server is running on port 3001'; Write-Host 'Status:' $response.StatusCode; Write-Host 'Content:' $response.Content } catch { Write-Host '❌ Local server is not responding'; Write-Host '🚀 Starting server...'; Start-Process -FilePath 'node' -ArgumentList 'server.js' -WindowStyle Hidden; Start-Sleep 3; try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing; Write-Host '✅ Server started successfully' } catch { Write-Host '❌ Failed to start server'; exit 1 } }"

echo.
echo 🌐 Checking frontend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing; Write-Host '✅ Frontend is accessible' } catch { Write-Host '❌ Frontend is not accessible'; exit 1 }"

echo.
echo 📄 Checking example AAR...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/example-aar.html' -UseBasicParsing; Write-Host '✅ Example AAR is accessible' } catch { Write-Host '❌ Example AAR is not accessible'; exit 1 }"

echo.
echo 📝 Checking Git status...
git status --porcelain > temp_status.txt
if %errorlevel% equ 0 (
    for /f %%i in (temp_status.txt) do (
        echo ⚠️  There are uncommitted changes
        echo 📋 Uncommitted files:
        type temp_status.txt
        goto :git_check_done
    )
    echo ✅ All changes are committed
    :git_check_done
    del temp_status.txt
) else (
    echo ❌ Git status check failed
)

echo.
echo 🔗 Checking remote connection...
git remote -v | findstr origin > nul
if %errorlevel% equ 0 (
    echo ✅ Connected to remote repository
    for /f "tokens=2" %%i in ('git remote get-url origin') do echo 📍 Remote URL: %%i
) else (
    echo ❌ Not connected to remote repository
)

echo.
echo 🎉 Health check complete!
echo 🌐 Local URL: http://localhost:3001
echo 📊 Health endpoint: http://localhost:3001/api/health
echo 📄 Example AAR: http://localhost:3001/example-aar.html
pause
