#!/bin/bash

# Quick Start Script for Admin Panel Service
# This script helps users get started quickly with either local or remote Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  🚀 Admin Panel Service                      ║"
echo "║                    Quick Start Guide                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    local missing_deps=()
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("Docker")
    elif ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is installed but not running${NC}"
        missing_deps+=("Docker (running)")
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_deps+=("Docker Compose")
    fi
    
    # Check Node.js (optional but recommended)
    if ! command_exists node; then
        echo -e "${YELLOW}⚠️  Node.js not found (optional but recommended)${NC}"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing dependencies:${NC}"
        printf '%s\n' "${missing_deps[@]}"
        echo ""
        echo -e "${YELLOW}Please install the missing dependencies and try again.${NC}"
        echo -e "${BLUE}📖 Installation guides:${NC}"
        echo -e "  Docker: https://docs.docker.com/get-docker/"
        echo -e "  Node.js: https://nodejs.org/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met!${NC}"
}

# Function to show setup options
show_setup_options() {
    echo -e "${BLUE}🎯 Choose your setup:${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} Local Development (Supabase local stack)"
    echo -e "   • Everything runs locally"
    echo -e "   • No external dependencies"
    echo -e "   • Perfect for development and testing"
    echo ""
    echo -e "${YELLOW}2.${NC} Remote Supabase (Cloud hosted)"
    echo -e "   • Uses your Supabase cloud project"
    echo -e "   • Production-ready setup"
    echo -e "   • Requires Supabase account"
    echo ""
    echo -e "${YELLOW}3.${NC} Docker Only (No database setup)"
    echo -e "   • Just start the containers"
    echo -e "   • Configure database connection manually"
    echo -e "   • For advanced users"
    echo ""
    
    while true; do
        read -p "$(echo -e ${YELLOW}Choose option [1-3]:${NC} )" choice
        case $choice in
            1) setup_local; break;;
            2) setup_remote; break;;
            3) setup_docker_only; break;;
            *) echo -e "${RED}Invalid option. Please choose 1, 2, or 3.${NC}";;
        esac
    done
}

# Function to setup local development
setup_local() {
    echo -e "${BLUE}🏠 Setting up local development environment...${NC}"
    
    # Copy environment file
    if [ ! -f "$ROOT_DIR/.env" ]; then
        echo -e "${YELLOW}📝 Creating environment file...${NC}"
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        
        # Set local development defaults
        sed -i.bak 's|SUPABASE_URL=.*|SUPABASE_URL=http://localhost:54321|' "$ROOT_DIR/.env"
        sed -i.bak 's|NODE_ENV=.*|NODE_ENV=development|' "$ROOT_DIR/.env"
        sed -i.bak 's|BUILD_TARGET=.*|BUILD_TARGET=development|' "$ROOT_DIR/.env"
        
        echo -e "${GREEN}✅ Environment file created${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists, skipping creation${NC}"
    fi
    
    # Run Supabase setup script
    echo -e "${YELLOW}🔧 Setting up Supabase...${NC}"
    bash "$SCRIPT_DIR/setup-supabase.sh" local
    
    # Start Docker services
    echo -e "${YELLOW}🚀 Starting Docker services...${NC}"
    cd "$ROOT_DIR"
    docker-compose -f docker/docker-compose.yml --profile local-db up -d
    
    show_success_local
}

# Function to setup remote Supabase
setup_remote() {
    echo -e "${BLUE}☁️  Setting up remote Supabase connection...${NC}"
    
    echo -e "${YELLOW}📋 Please provide your Supabase project details:${NC}"
    echo -e "   You can find these in your Supabase dashboard"
    echo -e "   Dashboard: https://supabase.com/dashboard"
    echo ""
    
    read -p "$(echo -e ${YELLOW}Supabase Project ID:${NC} )" project_id
    read -p "$(echo -e ${YELLOW}Supabase Service Key:${NC} )" service_key
    
    if [ -z "$project_id" ] || [ -z "$service_key" ]; then
        echo -e "${RED}❌ Project ID and Service Key are required${NC}"
        exit 1
    fi
    
    # Copy environment file
    if [ ! -f "$ROOT_DIR/.env" ]; then
        echo -e "${YELLOW}📝 Creating environment file...${NC}"
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        
        # Set remote configuration
        sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=https://$project_id.supabase.co|" "$ROOT_DIR/.env"
        sed -i.bak "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$service_key|" "$ROOT_DIR/.env"
        sed -i.bak 's|NODE_ENV=.*|NODE_ENV=production|' "$ROOT_DIR/.env"
        sed -i.bak 's|BUILD_TARGET=.*|BUILD_TARGET=production|' "$ROOT_DIR/.env"
        
        echo -e "${GREEN}✅ Environment file created${NC}"
        echo -e "${YELLOW}⚠️  Don't forget to set your SUPABASE_ANON_KEY in .env${NC}"
    fi
    
    # Run Supabase setup script
    echo -e "${YELLOW}🔧 Setting up Supabase connection...${NC}"
    bash "$SCRIPT_DIR/setup-supabase.sh" remote "$project_id" "$service_key"
    
    # Start Docker services (without local database)
    echo -e "${YELLOW}🚀 Starting Docker services...${NC}"
    cd "$ROOT_DIR"
    docker-compose -f docker/docker-compose.yml up -d
    
    show_success_remote
}

# Function to setup Docker only
setup_docker_only() {
    echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
    
    # Copy environment file if it doesn't exist
    if [ ! -f "$ROOT_DIR/.env" ]; then
        echo -e "${YELLOW}📝 Creating environment file...${NC}"
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        echo -e "${YELLOW}⚠️  Please configure .env file with your database settings${NC}"
    fi
    
    # Start Docker services
    cd "$ROOT_DIR"
    docker-compose -f docker/docker-compose.yml up -d
    
    show_success_docker
}

# Function to show local success message
show_success_local() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   🎉 Local Setup Complete!                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${BLUE}📱 Access your admin panel:${NC}"
    echo -e "  Frontend: ${YELLOW}http://localhost:3001${NC}"
    echo -e "  API: ${YELLOW}http://localhost:3000${NC}"
    echo -e "  Supabase Studio: ${YELLOW}http://localhost:54323${NC}"
    echo ""
    echo -e "${BLUE}🔐 Default credentials:${NC}"
    echo -e "  Email: ${YELLOW}admin@localhost${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC} (if created during setup)"
    echo ""
    echo -e "${BLUE}📚 Useful commands:${NC}"
    echo -e "  View logs: ${YELLOW}docker-compose -f docker/docker-compose.yml logs -f${NC}"
    echo -e "  Stop services: ${YELLOW}docker-compose -f docker/docker-compose.yml down${NC}"
    echo -e "  Reset database: ${YELLOW}supabase db reset${NC}"
    echo ""
}

# Function to show remote success message
show_success_remote() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  🎉 Remote Setup Complete!                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${BLUE}📱 Access your admin panel:${NC}"
    echo -e "  Frontend: ${YELLOW}http://localhost:3001${NC}"
    echo -e "  API: ${YELLOW}http://localhost:3000${NC}"
    echo -e "  Supabase Dashboard: ${YELLOW}https://supabase.com/dashboard${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Important next steps:${NC}"
    echo -e "  1. Set your SUPABASE_ANON_KEY in .env file"
    echo -e "  2. Create admin user in Supabase dashboard"
    echo -e "  3. Configure authentication settings"
    echo ""
}

# Function to show Docker-only success message
show_success_docker() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 🎉 Docker Setup Complete!                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${BLUE}📱 Services running:${NC}"
    echo -e "  Frontend: ${YELLOW}http://localhost:3001${NC}"
    echo -e "  API: ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo -e "  Configure your database connection in .env file"
    echo -e "  The services may not work until database is configured"
    echo ""
}

# Function to show development tips
show_development_tips() {
    echo -e "${PURPLE}💡 Development Tips:${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Making changes:${NC}"
    echo -e "  • Frontend code: Edit files in frontend/ - hot reload enabled"
    echo -e "  • Backend code: Edit files in api/ - auto-restart enabled"
    echo -e "  • Database schema: Edit database/schema.sql and run setup again"
    echo ""
    echo -e "${YELLOW}🐛 Debugging:${NC}"
    echo -e "  • View API logs: ${YELLOW}docker logs admin-panel-api -f${NC}"
    echo -e "  • View frontend logs: ${YELLOW}docker logs admin-panel-frontend -f${NC}"
    echo -e "  • Access database: Check .env for connection details"
    echo ""
    echo -e "${YELLOW}📊 Monitoring:${NC}"
    echo -e "  • Health check: ${YELLOW}curl http://localhost:3000/api/health${NC}"
    echo -e "  • API metrics: ${YELLOW}http://localhost:3000/api/metrics${NC}"
    echo ""
    echo -e "${YELLOW}🔄 Restarting services:${NC}"
    echo -e "  • All services: ${YELLOW}docker-compose -f docker/docker-compose.yml restart${NC}"
    echo -e "  • Specific service: ${YELLOW}docker-compose -f docker/docker-compose.yml restart api${NC}"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    show_setup_options
    show_development_tips
    
    echo -e "${GREEN}🚀 Happy coding!${NC}"
    echo -e "${BLUE}📖 Documentation: ${YELLOW}./docs/${NC}"
    echo -e "${BLUE}🐛 Issues: ${YELLOW}https://github.com/your-repo/issues${NC}"
}

# Run main function
main "$@"