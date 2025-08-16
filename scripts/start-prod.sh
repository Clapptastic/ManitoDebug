#!/bin/bash
set -e

echo "🚀 Starting ManitoDebug Production Environment"
echo "🔧 Initializing dynamic port management..."

# Set production environment variables
export NODE_ENV=production
export ENABLE_DYNAMIC_PORTS=true
export PORT_RANGE_START=3000
export PORT_RANGE_END=3010
export CLIENT_PORT_RANGE_START=5173
export CLIENT_PORT_RANGE_END=5180
export WEBSOCKET_PORT_RANGE_START=3001
export WEBSOCKET_PORT_RANGE_END=3010

# Use provided PORT or default to 3000
export PORT=${PORT:-3000}

echo "🌟 Starting production server on port $PORT"
echo "   • Dynamic port management enabled"
echo "   • Health check: http://localhost:$PORT/api/health"
echo "   • API endpoints: http://localhost:$PORT/api/*"
echo ""

# Start the production server
exec node server/index.js
