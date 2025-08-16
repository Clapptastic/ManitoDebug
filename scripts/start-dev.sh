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
echo "   • Server: Dynamic port assignment (typically 3000)"
echo "   • Client: Dynamic port assignment (typically 5173)"
echo "   • Debugger: http://localhost:9229"
echo "   • Port conflicts will be automatically resolved"
echo ""

# Set environment variables for dynamic port management
export NODE_ENV=development
export ENABLE_DYNAMIC_PORTS=true
export PORT_RANGE_START=3000
export PORT_RANGE_END=3010
export CLIENT_PORT_RANGE_START=5173
export CLIENT_PORT_RANGE_END=5180
export WEBSOCKET_PORT_RANGE_START=3001
export WEBSOCKET_PORT_RANGE_END=3010

# Start the development servers
exec npm run dev
