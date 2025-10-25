#!/bin/bash

# ThreatRecon Deployment Script
echo "🚀 Deploying ThreatRecon Breach Drill Automation Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cat > .env << EOF
# ThreatRecon Environment Configuration
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://threatrecon:threatrecon_password@postgres:5432/threatrecon
REDIS_URL=redis://:redis_password@redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)
SIGNING_KEY_ID=tr-public-hosted-v1
SIGNING_SECRET=your-signing-secret-change-in-production-$(date +%s)
SESSION_RETENTION_DAYS=30
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
EOF
    echo "✅ Environment file created with secure random secrets"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

# Check database
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U threatrecon > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

echo ""
echo "🎉 ThreatRecon deployment complete!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Health Check: http://localhost:3001/health"
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔒 Security Notes:"
echo "   - Change JWT_SECRET and SIGNING_SECRET in .env for production"
echo "   - Configure SSL certificates in ./ssl/ directory"
echo "   - Review nginx.conf for additional security settings"
echo ""
echo "🚀 ThreatRecon is ready for breach drills!"
