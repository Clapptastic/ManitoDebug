#!/bin/bash
set -e

echo "🚀 Starting ManitoDebug Production Environment"
echo "🔧 Initializing dynamic port management..."

# Set production environment variables
export NODE_ENV=production
export ENABLE_DYNAMIC_PORTS=true
export PORT_MANAGER_STRATEGY=conservative
export PORT_HEALTH_CHECK_TIMEOUT=5000
export PORT_MAX_RETRIES=5
export PORT_AUTO_REASSIGN=false

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

# Use provided PORT or let dynamic manager assign
export PORT=${PORT:-}

echo "🌟 Starting production server with dynamic port management..."
echo "   • Server: Dynamic port assignment (3000-3999 range)"
echo "   • Client: Dynamic port assignment (3000-3999 range)"
echo "   • WebSocket: Inherits server port automatically"
echo "   • Database: Dynamic port assignment (5432-5439 range)"
echo "   • Redis: Dynamic port assignment (6379-6389 range)"
echo "   • Monitoring: Dynamic port assignment (9090-9099 range)"
echo "   • Port conflicts will be resolved with conservative strategy"
echo "   • Health check: http://localhost:3000/api/health (or assigned port)"
echo "   • API endpoints: http://localhost:3000/api/* (or assigned port)"
echo ""

# Start the production server
exec node server/index.js
