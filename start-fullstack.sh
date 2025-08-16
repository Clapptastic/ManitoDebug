#!/bin/bash

# ManitoDebug Full Stack Startup Script
echo "🚀 Starting ManitoDebug Full Stack..."

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check required ports
check_port 3000 || exit 1
check_port 5173 || exit 1

# Set environment variables
export NODE_ENV=development
export PORT=3000
export CLIENT_URL=http://localhost:5173

# Start the full stack
echo "🔧 Starting server and client..."
npm run dev

echo "✅ ManitoDebug Full Stack is running!"
echo "📱 Client: http://localhost:5173"
echo "🔌 Server: http://localhost:3000"
echo "📊 Health: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop all services"
