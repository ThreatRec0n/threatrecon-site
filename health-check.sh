#!/bin/bash

# ThreatRecon Platform Health Check Script
# This script monitors the platform and ensures it's running properly

echo "🔍 ThreatRecon Platform Health Check"
echo "=================================="

# Check if Node.js server is running
echo "📊 Checking local server..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Local server is running on port 3001"
    curl -s http://localhost:3001/api/health | jq .
else
    echo "❌ Local server is not responding"
    echo "🚀 Starting server..."
    node server.js &
    sleep 3
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Server started successfully"
    else
        echo "❌ Failed to start server"
        exit 1
    fi
fi

# Check frontend
echo ""
echo "🌐 Checking frontend..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

# Check example AAR
echo ""
echo "📄 Checking example AAR..."
if curl -s http://localhost:3001/example-aar.html > /dev/null; then
    echo "✅ Example AAR is accessible"
else
    echo "❌ Example AAR is not accessible"
    exit 1
fi

# Check Git status
echo ""
echo "📝 Checking Git status..."
if git status --porcelain | grep -q .; then
    echo "⚠️  There are uncommitted changes"
    echo "📋 Uncommitted files:"
    git status --porcelain
else
    echo "✅ All changes are committed"
fi

# Check if connected to remote
echo ""
echo "🔗 Checking remote connection..."
if git remote -v | grep -q origin; then
    echo "✅ Connected to remote repository"
    echo "📍 Remote URL: $(git remote get-url origin)"
else
    echo "❌ Not connected to remote repository"
fi

echo ""
echo "🎉 Health check complete!"
echo "🌐 Local URL: http://localhost:3001"
echo "📊 Health endpoint: http://localhost:3001/api/health"
echo "📄 Example AAR: http://localhost:3001/example-aar.html"
