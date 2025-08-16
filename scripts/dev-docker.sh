#!/bin/bash

# ManitoDebug Development Docker Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default configuration
COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_NAME="manito-dev"

# Function to display usage
usage() {
    echo -e "${BLUE}ManitoDebug Development Docker Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  up          Start development environment"
    echo "  down        Stop development environment"
    echo "  restart     Restart development environment"
    echo "  logs        Show logs from all services"
    echo "  shell       Open shell in development container"
    echo "  test        Run tests in development environment"
    echo "  clean       Clean up containers, volumes, and images"
    echo "  status      Show status of all services"
    echo "  build       Rebuild development images"
    echo ""
    echo "Options:"
    echo "  --detach    Run in detached mode (background)"
    echo "  --no-deps   Don't start dependencies (Redis, PostgreSQL)"
    echo "  --testing   Start with testing profile"
    echo "  --tools     Start with tools profile"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start development environment"
    echo "  $0 up --detach          # Start in background"
    echo "  $0 up --testing         # Start with testing tools"
    echo "  $0 logs manito-dev      # Show logs for main service"
    echo "  $0 shell                # Open shell in container"
    echo "  $0 test                 # Run all tests"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
}

# Function to check if docker-compose is available
check_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose and try again.${NC}"
        exit 1
    fi
}

# Function to start development environment
dev_up() {
    echo -e "${GREEN}🚀 Starting ManitoDebug Development Environment...${NC}"
    
    # Build profiles array
    PROFILES=""
    DETACH=""
    
    for arg in "$@"; do
        case $arg in
            --detach)
                DETACH="-d"
                ;;
            --testing)
                PROFILES="$PROFILES testing"
                ;;
            --tools)
                PROFILES="$PROFILES tools"
                ;;
            --no-deps)
                echo -e "${YELLOW}⚠️  Starting without dependencies...${NC}"
                docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up $DETACH manito-dev
                return
                ;;
        esac
    done
    
    echo -e "${BLUE}📦 Building and starting services...${NC}"
    if [[ -n "$PROFILES" ]]; then
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME --profile $PROFILES up $DETACH
    else
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up $DETACH
    fi
    
    if [[ -z "$DETACH" ]]; then
        echo -e "${GREEN}✅ Development environment started!${NC}"
        echo -e "${BLUE}🚀 Quick Access:${NC}"
        echo -e "   • ${CYAN}🌐 Open UI:${NC} ${YELLOW}http://localhost:5173${NC}"
        echo -e "   • ${CYAN}🔗 API Health:${NC} ${YELLOW}http://localhost:3000/api/health${NC}"
        echo -e "   • ${CYAN}🛢️ Database:${NC} ${YELLOW}localhost:5432${NC} (manito_dev/manito_dev_password)"
        echo -e "   • ${CYAN}🔴 Redis:${NC} ${YELLOW}localhost:6379${NC}"
        echo ""
        echo -e "${BLUE}📋 Development Info:${NC}"
        echo -e "   • All services with hot reloading"
        echo -e "   • Press Ctrl+C to stop all services"
        echo -e "   • Check terminal for container status and logs"
        echo ""
        echo -e "${BLUE}🛠️ Management Commands:${NC}"
        echo -e "   • View logs: ${YELLOW}./scripts/dev-docker.sh logs${NC}"
        echo -e "   • Check status: ${YELLOW}./scripts/dev-docker.sh status${NC}"
        echo -e "   • Open shell: ${YELLOW}./scripts/dev-docker.sh shell${NC}"
    fi
}

# Function to stop development environment
dev_down() {
    echo -e "${YELLOW}🛑 Stopping ManitoDebug Development Environment...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
    echo -e "${GREEN}✅ Development environment stopped!${NC}"
}

# Function to restart development environment
dev_restart() {
    echo -e "${YELLOW}🔄 Restarting ManitoDebug Development Environment...${NC}"
    dev_down
    dev_up "$@"
}

# Function to show logs
dev_logs() {
    SERVICE=${1:-""}
    if [[ -n "$SERVICE" ]]; then
        echo -e "${BLUE}📋 Showing logs for service: $SERVICE${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f $SERVICE
    else
        echo -e "${BLUE}📋 Showing logs for all services...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
    fi
}

# Function to open shell in development container
dev_shell() {
    echo -e "${BLUE}🖥️  Opening shell in development container...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec manito-dev /bin/bash
}

# Function to run tests
dev_test() {
    echo -e "${BLUE}🧪 Running tests in development environment...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME --profile testing up test-runner
}

# Function to clean up
dev_clean() {
    echo -e "${YELLOW}🧹 Cleaning up development environment...${NC}"
    echo -e "${RED}⚠️  This will remove all containers, networks, and volumes!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --rmi local --remove-orphans
        echo -e "${GREEN}✅ Cleanup completed!${NC}"
    else
        echo -e "${BLUE}Operation cancelled.${NC}"
    fi
}

# Function to show status
dev_status() {
    echo -e "${BLUE}📊 Development Environment Status:${NC}"
    echo ""
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
    echo ""
    echo -e "${BLUE}📈 Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps -q 2>/dev/null) 2>/dev/null || echo "No running containers"
}

# Function to rebuild images
dev_build() {
    echo -e "${BLUE}🔨 Rebuilding development images...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    echo -e "${GREEN}✅ Images rebuilt successfully!${NC}"
}

# Main script logic
main() {
    # Check prerequisites
    check_docker
    check_compose
    
    # Change to project directory
    cd "$(dirname "$0")/.."
    
    # Parse command
    COMMAND=${1:-"up"}
    shift || true
    
    case $COMMAND in
        up)
            dev_up "$@"
            ;;
        down)
            dev_down
            ;;
        restart)
            dev_restart "$@"
            ;;
        logs)
            dev_logs "$@"
            ;;
        shell)
            dev_shell
            ;;
        test)
            dev_test
            ;;
        clean)
            dev_clean
            ;;
        status)
            dev_status
            ;;
        build)
            dev_build
            ;;
        --help|help)
            usage
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"