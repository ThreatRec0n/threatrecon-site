# ThreatRecon Platform Auto-Monitor
# This script continuously monitors the platform and ensures it stays running

Write-Host "🚀 ThreatRecon Platform Auto-Monitor Started" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

$checkInterval = 30  # Check every 30 seconds
$maxRetries = 3
$retryCount = 0

while ($true) {
    try {
        Write-Host "`n🔍 Checking platform health at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
        
        # Check server health
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server healthy - Status: $($response.StatusCode)" -ForegroundColor Green
            $retryCount = 0  # Reset retry count on success
        } else {
            throw "Server returned status: $($response.StatusCode)"
        }
        
        # Check frontend
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 10
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Host "✅ Frontend accessible - Content Length: $($frontendResponse.Content.Length) chars" -ForegroundColor Green
        } else {
            throw "Frontend returned status: $($frontendResponse.StatusCode)"
        }
        
        # Check if there are any Node.js processes running
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            Write-Host "✅ Node.js processes running: $($nodeProcesses.Count)" -ForegroundColor Green
        } else {
            throw "No Node.js processes found"
        }
        
        Write-Host "🎉 All systems operational!" -ForegroundColor Green
        
    } catch {
        $retryCount++
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "🔄 Retry attempt $retryCount of $maxRetries" -ForegroundColor Yellow
        
        if ($retryCount -ge $maxRetries) {
            Write-Host "🚨 Maximum retries reached. Attempting to restart server..." -ForegroundColor Red
            
            # Kill existing Node processes
            Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
            
            # Wait a moment
            Start-Sleep -Seconds 5
            
            # Start server
            Write-Host "🚀 Starting ThreatRecon server..." -ForegroundColor Yellow
            Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
            
            # Wait for server to start
            Start-Sleep -Seconds 10
            
            # Test if server is now running
            try {
                $testResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
                if ($testResponse.StatusCode -eq 200) {
                    Write-Host "✅ Server restarted successfully!" -ForegroundColor Green
                    $retryCount = 0
                } else {
                    Write-Host "❌ Server restart failed" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Server restart failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "⏰ Waiting $checkInterval seconds until next check..." -ForegroundColor Gray
    Start-Sleep -Seconds $checkInterval
}
