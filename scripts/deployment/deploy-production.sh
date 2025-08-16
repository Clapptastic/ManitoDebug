#!/bin/bash

# Production Deployment Script for Manito
# =======================================
# This script handles the complete production deployment process

set -e  # Exit on any error

# Configuration
DOCKER_IMAGE_NAME="manito-app"
DOCKER_TAG="${DOCKER_TAG:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
BACKUP_ENABLED="${BACKUP_ENABLED:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_error "Environment file .env.${ENVIRONMENT} not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Backup existing data
backup_data() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        log_info "Creating backup of existing data..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        if docker-compose ps | grep -q postgres; then
            log_info "Backing up PostgreSQL database..."
            docker-compose exec -T postgres pg_dump -U manito_user manito > "$BACKUP_DIR/database.sql"
        fi
        
        # Backup volumes
        log_info "Backing up Docker volumes..."
        docker run --rm -v manito-package_postgres-data:/data -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf /backup/postgres-data.tar.gz -C /data .
        docker run --rm -v manito-package_redis-data:/data -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf /backup/redis-data.tar.gz -C /data .
        
        log_success "Backup created in $BACKUP_DIR"
    else
        log_warning "Backup disabled - skipping backup step"
    fi
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    # Build production image
    docker build -f Dockerfile.prod -t "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}" .
    
    if [ $? -eq 0 ]; then
        log_success "Docker image built successfully"
    else
        log_error "Docker image build failed"
        exit 1
    fi
    
    # Tag with timestamp for rollback capability
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker tag "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}" "${DOCKER_IMAGE_NAME}:${TIMESTAMP}"
    
    log_info "Image tagged as ${DOCKER_IMAGE_NAME}:${TIMESTAMP}"
}

# Run pre-deployment tests
run_tests() {
    log_info "Running pre-deployment tests..."
    
    # Health check test
    if docker run --rm "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}" node -e "console.log('Node.js runtime test passed')"; then
        log_success "Runtime test passed"
    else
        log_error "Runtime test failed"
        exit 1
    fi
    
    # TODO: Add more comprehensive tests here
    # - API endpoint tests
    # - Database connection tests
    # - Security scan
    
    log_success "All pre-deployment tests passed"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing containers gracefully
    log_info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml --env-file ".env.${ENVIRONMENT}" down --timeout 30
    
    # Remove old images (keep last 3 for rollback)
    log_info "Cleaning up old images..."
    docker images "${DOCKER_IMAGE_NAME}" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep -v latest | tail -n +4 | awk '{print $1}' | xargs -r docker rmi || true
    
    # Start new deployment
    log_info "Starting new containers..."
    docker-compose -f docker-compose.prod.yml --env-file ".env.${ENVIRONMENT}" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Verify deployment
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_success "Containers started successfully"
    else
        log_error "Container startup failed"
        exit 1
    fi
}

# Verify deployment health
verify_deployment() {
    log_info "Verifying deployment health..."
    
    # Wait a bit more for full startup
    sleep 10
    
    # Health check
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "Health check passed"
            break
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Health check failed after $max_attempts attempts"
        
        # Show container logs for debugging
        log_info "Container logs:"
        docker-compose -f docker-compose.prod.yml logs --tail=50
        
        exit 1
    fi
    
    # Test database connectivity
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U manito_user &> /dev/null; then
        log_success "Database connectivity verified"
    else
        log_warning "Database connectivity check failed"
    fi
    
    # Test Redis connectivity
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping &> /dev/null; then
        log_success "Redis connectivity verified"
    else
        log_warning "Redis connectivity check failed"
    fi
}

# Post-deployment tasks
post_deployment_tasks() {
    log_info "Running post-deployment tasks..."
    
    # Database migrations (if any)
    # docker-compose -f docker-compose.prod.yml exec manito-app npm run migrate
    
    # Warm up cache
    log_info "Warming up application cache..."
    curl -s http://localhost:3000/api/health?detailed=true > /dev/null || true
    
    # Send deployment notification (if configured)
    if [ -n "$WEBHOOK_URL" ]; then
        log_info "Sending deployment notification..."
        curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d "{\"message\":\"Manito production deployment completed successfully\"}" || true
    fi
    
    log_success "Post-deployment tasks completed"
}

# Main deployment process
main() {
    log_info "Starting production deployment for Manito..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Docker tag: $DOCKER_TAG"
    
    check_prerequisites
    backup_data
    build_images
    run_tests
    deploy_application
    verify_deployment
    post_deployment_tasks
    
    log_success "🎉 Production deployment completed successfully!"
    log_info "Application is available at: http://localhost:3000"
    log_info "Health check: http://localhost:3000/api/health"
    log_info "Monitoring (if enabled): http://localhost:3001 (Grafana), http://localhost:9090 (Prometheus)"
}

# Handle script termination
cleanup() {
    log_warning "Deployment interrupted"
    exit 1
}

trap cleanup SIGINT SIGTERM

# Run main function
main "$@"