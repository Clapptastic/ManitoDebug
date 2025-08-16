#!/bin/bash

# Rollback Script for Manito Production Deployment
# ================================================
# This script rolls back to a previous deployment version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE_NAME="manito-app"
ENVIRONMENT="${ENVIRONMENT:-production}"

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

# Show available versions for rollback
show_available_versions() {
    log_info "Available versions for rollback:"
    docker images "${DOCKER_IMAGE_NAME}" --format "table {{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" | head -10
}

# Rollback to specific version
rollback_to_version() {
    local target_version="$1"
    
    if [ -z "$target_version" ]; then
        log_error "No target version specified"
        show_available_versions
        exit 1
    fi
    
    # Check if target version exists
    if ! docker images "${DOCKER_IMAGE_NAME}:${target_version}" --format "{{.Repository}}" | grep -q "${DOCKER_IMAGE_NAME}"; then
        log_error "Version ${target_version} not found"
        show_available_versions
        exit 1
    fi
    
    log_info "Rolling back to version: ${target_version}"
    
    # Create backup tag for current version
    CURRENT_VERSION=$(date +%Y%m%d_%H%M%S)_rollback_from
    docker tag "${DOCKER_IMAGE_NAME}:latest" "${DOCKER_IMAGE_NAME}:${CURRENT_VERSION}" || true
    
    # Tag target version as latest
    docker tag "${DOCKER_IMAGE_NAME}:${target_version}" "${DOCKER_IMAGE_NAME}:latest"
    
    # Stop current containers
    log_info "Stopping current containers..."
    docker-compose -f docker-compose.prod.yml --env-file ".env.${ENVIRONMENT}" down --timeout 30
    
    # Start containers with rolled back version
    log_info "Starting containers with version ${target_version}..."
    docker-compose -f docker-compose.prod.yml --env-file ".env.${ENVIRONMENT}" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Verify rollback
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "Rollback successful - health check passed"
            break
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 5s..."
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Rollback failed - health check did not pass"
        
        # Show logs for debugging
        docker-compose -f docker-compose.prod.yml logs --tail=50
        
        exit 1
    fi
    
    log_success "Rollback to version ${target_version} completed successfully!"
}

# Rollback database from backup
rollback_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified"
        log_info "Available backups:"
        ls -la backups/*/database.sql 2>/dev/null || log_warning "No database backups found"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "⚠️  This will overwrite the current database!"
    echo -n "Are you sure you want to continue? (yes/no): "
    read confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Database rollback cancelled"
        exit 0
    fi
    
    log_info "Rolling back database from: $backup_file"
    
    # Create a backup of current database before rollback
    CURRENT_BACKUP="backups/rollback_$(date +%Y%m%d_%H%M%S)/database.sql"
    mkdir -p "$(dirname "$CURRENT_BACKUP")"
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U manito_user manito > "$CURRENT_BACKUP"
    log_info "Current database backed up to: $CURRENT_BACKUP"
    
    # Restore from backup
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U manito_user -d manito < "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_success "Database rollback completed successfully"
    else
        log_error "Database rollback failed"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Manito Rollback Script"
    echo "====================="
    echo ""
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  app VERSION           Roll back application to specified version"
    echo "  database BACKUP_FILE  Roll back database from backup file"
    echo "  list                  Show available versions"
    echo "  help                  Show this help message"
    echo ""
    echo "Options:"
    echo "  -e, --environment     Environment (default: production)"
    echo ""
    echo "Examples:"
    echo "  $0 app 20241201_143022"
    echo "  $0 database backups/20241201_120000/database.sql"
    echo "  $0 list"
}

# Main function
main() {
    case "${1:-help}" in
        "app")
            if [ -z "$2" ]; then
                log_error "Version not specified"
                show_available_versions
                exit 1
            fi
            rollback_to_version "$2"
            ;;
        "database")
            rollback_database "$2"
            ;;
        "list")
            show_available_versions
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        *)
            main "$@"
            exit 0
            ;;
    esac
done

# If no arguments, show help
if [ $# -eq 0 ]; then
    show_help
fi