#!/bin/bash
set -e

echo "🚀 Starting ManitoDebug Development Environment"
echo "📦 Installing/updating dependencies..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "core/node_modules" ]; then
    echo "Installing core dependencies..."
    cd core && npm install && cd ..
fi

echo "🔧 Running development setup..."
npm run ensure-setup

echo "🌟 Starting development servers with dynamic port management..."
echo "   • Server: Dynamic port assignment (3000-3999 range)"
echo "   • Client: Dynamic port assignment (3000-3999 range)"
echo "   • WebSocket: Inherits server port automatically"
echo "   • Database: Dynamic port assignment (5432-5439 range)"
echo "   • Redis: Dynamic port assignment (6379-6389 range)"
echo "   • Monitoring: Dynamic port assignment (9090-9099 range)"
echo "   • Debugger: http://localhost:9229"
echo "   • Port conflicts will be automatically resolved with minimal strategy"
echo ""

# Set environment variables for dynamic port management
export NODE_ENV=development
export ENABLE_DYNAMIC_PORTS=true
export PORT_MANAGER_STRATEGY=minimal
export PORT_HEALTH_CHECK_TIMEOUT=5000
export PORT_MAX_RETRIES=5
export PORT_AUTO_REASSIGN=true

# Port ranges for dynamic assignment
export SERVER_PORT_RANGE_START=3000
export SERVER_PORT_RANGE_END=3999
export CLIENT_PORT_RANGE_START=3000
export CLIENT_PORT_RANGE_END=3999
export DATABASE_PORT_RANGE_START=5432
export DATABASE_PORT_RANGE_END=5439
export REDIS_PORT_RANGE_START=6379
export REDIS_PORT_RANGE_END=6389
export MONITORING_PORT_RANGE_START=9090
export MONITORING_PORT_RANGE_END=9099

# Start the development servers
exec npm run dev
