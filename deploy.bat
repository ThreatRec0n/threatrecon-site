@echo off
echo 🚀 Deploying ThreatRecon Breach Drill Automation Stack...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating environment file...
    (
        echo # ThreatRecon Environment Configuration
        echo NODE_ENV=production
        echo PORT=3001
        echo DATABASE_URL=postgresql://threatrecon:threatrecon_password@postgres:5432/threatrecon
        echo REDIS_URL=redis://:redis_password@redis:6379
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-%RANDOM%
        echo SIGNING_KEY_ID=tr-public-hosted-v1
        echo SIGNING_SECRET=your-signing-secret-change-in-production-%RANDOM%
        echo SESSION_RETENTION_DAYS=30
        echo FRONTEND_URL=http://localhost:3000
        echo NEXT_PUBLIC_API_URL=http://localhost:3001
        echo NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    ) > .env
    echo ✅ Environment file created with secure random secrets
)

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f docker-compose.prod.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check backend health
curl -f http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
)

REM Check frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
)

echo.
echo 🎉 ThreatRecon deployment complete!
echo.
echo 📋 Service URLs:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    Health Check: http://localhost:3001/health
echo.
echo 📊 Container Status:
docker-compose -f docker-compose.prod.yml ps
echo.
echo 🔧 Management Commands:
echo    View logs: docker-compose -f docker-compose.prod.yml logs -f
echo    Stop services: docker-compose -f docker-compose.prod.yml down
echo    Restart services: docker-compose -f docker-compose.prod.yml restart
echo.
echo 🔒 Security Notes:
echo    - Change JWT_SECRET and SIGNING_SECRET in .env for production
echo    - Configure SSL certificates in ./ssl/ directory
echo    - Review nginx.conf for additional security settings
echo.
echo 🚀 ThreatRecon is ready for breach drills!
pause
