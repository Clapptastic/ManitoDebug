#!/bin/bash

# ManitoDebug Full Stack Startup Script with Dynamic Port Management
echo "🚀 Starting ManitoDebug Full Stack with Dynamic Port Management..."

# Function to check if a port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Function to find available port in range
find_available_port() {
    local start_port=$1
    local end_port=$2
    local service_name=$3
    
    for port in $(seq $start_port $end_port); do
        if check_port $port >/dev/null 2>&1; then
            echo "✅ Found available port for $service_name: $port"
            return 0
        fi
    done
    
    echo "❌ No available ports found for $service_name in range $start_port-$end_port"
    return 1
}

# Check and ensure setup is complete
echo "🔧 Verifying full stack setup..."
if [ ! -f "server/services/portManager.js" ]; then
    echo "⚠️  Dynamic port manager not found, running setup..."
    npm run ensure-setup
fi

# Check required port ranges
echo "🔍 Checking port availability..."
find_available_port 3000 3010 "Server" || {
    echo "❌ No available server ports found"
    exit 1
}

find_available_port 5173 5180 "Client" || {
    echo "❌ No available client ports found"
    exit 1
}

# Set environment variables for dynamic port management
export NODE_ENV=development
export ENABLE_DYNAMIC_PORTS=true
export PORT_RANGE_START=3000
export PORT_RANGE_END=3010
export CLIENT_PORT_RANGE_START=5173
export CLIENT_PORT_RANGE_END=5180
export WEBSOCKET_PORT_RANGE_START=3001
export WEBSOCKET_PORT_RANGE_END=3010

echo ""
echo "🌟 DYNAMIC PORT MANAGEMENT ENABLED"
echo "   • Server ports: 3000-3010 (automatic assignment)"
echo "   • Client ports: 5173-5180 (automatic assignment)"
echo "   • WebSocket ports: 3001-3010 (automatic assignment)"
echo "   • Port conflicts will be automatically resolved"
echo ""

# Start the full stack with dynamic port management
echo "🔧 Starting server and client with dynamic port management..."
echo "   The system will automatically:"
echo "   • Detect available ports"
echo "   • Resolve any port conflicts"
echo "   • Start services on optimal ports"
echo "   • Display the URLs for access"
echo ""

# Run the development servers
npm run dev

echo ""
echo "✅ ManitoDebug Full Stack is running with dynamic port management!"
echo "📱 Check the output above for the actual URLs"
echo "📊 Health check will be available at the server URL + /api/health"
echo ""
echo "Press Ctrl+C to stop all services"
