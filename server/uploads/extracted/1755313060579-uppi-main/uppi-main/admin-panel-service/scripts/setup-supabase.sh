#!/bin/bash

# Admin Panel Service - Supabase Setup Script
# This script sets up Supabase for the admin panel service
# Usage: ./setup-supabase.sh [local|remote] [project_id] [service_key]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SETUP_TYPE="${1:-local}"
PROJECT_ID="${2:-}"
SERVICE_KEY="${3:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Admin Panel Service - Supabase Setup${NC}"
echo -e "Setup type: ${YELLOW}$SETUP_TYPE${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Supabase CLI
install_supabase_cli() {
    echo -e "${YELLOW}📦 Installing Supabase CLI...${NC}"
    
    if command_exists npm; then
        npm install -g supabase
    elif command_exists brew; then
        brew install supabase/tap/supabase
    else
        echo -e "${RED}❌ Neither npm nor brew found. Please install Supabase CLI manually.${NC}"
        echo "Visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
}

# Function to setup local Supabase
setup_local() {
    echo -e "${BLUE}🏠 Setting up local Supabase...${NC}"
    
    # Check if Supabase CLI is installed
    if ! command_exists supabase; then
        install_supabase_cli
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    
    # Initialize Supabase project if not already done
    if [ ! -f "$ROOT_DIR/supabase/config.toml" ]; then
        echo -e "${YELLOW}📝 Initializing Supabase project...${NC}"
        cd "$ROOT_DIR"
        supabase init
    fi
    
    # Start Supabase
    echo -e "${YELLOW}🔄 Starting local Supabase...${NC}"
    cd "$ROOT_DIR"
    supabase start
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Get local credentials
    LOCAL_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    LOCAL_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
    LOCAL_SERVICE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')
    
    # Apply database schema
    echo -e "${YELLOW}📊 Applying database schema...${NC}"
    supabase db reset
    
    # Run migrations if they exist
    if [ -d "$ROOT_DIR/supabase/migrations" ] && [ "$(ls -A $ROOT_DIR/supabase/migrations)" ]; then
        echo -e "${YELLOW}🔄 Running migrations...${NC}"
        supabase db push
    fi
    
    # Apply custom schema
    if [ -f "$ROOT_DIR/database/schema.sql" ]; then
        echo -e "${YELLOW}🔧 Applying custom schema...${NC}"
        psql "${LOCAL_URL/https:\/\//postgresql://postgres:postgres@localhost:54322/}" -f "$ROOT_DIR/database/schema.sql"
    fi
    
    # Create .env file for local development
    cat > "$ROOT_DIR/.env.local" << EOF
# Local Supabase Configuration
SUPABASE_URL=$LOCAL_URL
SUPABASE_ANON_KEY=$LOCAL_ANON_KEY
SUPABASE_SERVICE_KEY=$LOCAL_SERVICE_KEY

# Database Configuration
DB_HOST=localhost
DB_PORT=54322
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration (if using local Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME=Admin Panel Service
APP_VERSION=1.0.0
TENANT_ID=default
ADMIN_EMAIL=admin@localhost
EOF
    
    echo -e "${GREEN}✅ Local Supabase setup completed!${NC}"
    echo -e "${BLUE}📋 Connection details:${NC}"
    echo -e "  URL: ${YELLOW}$LOCAL_URL${NC}"
    echo -e "  Anon Key: ${YELLOW}$LOCAL_ANON_KEY${NC}"
    echo -e "  Dashboard: ${YELLOW}http://localhost:54323${NC}"
    echo ""
    echo -e "${BLUE}🔧 Environment file created: ${YELLOW}.env.local${NC}"
}

# Function to setup remote Supabase
setup_remote() {
    echo -e "${BLUE}☁️  Setting up remote Supabase...${NC}"
    
    if [ -z "$PROJECT_ID" ] || [ -z "$SERVICE_KEY" ]; then
        echo -e "${RED}❌ Project ID and Service Key are required for remote setup${NC}"
        echo "Usage: $0 remote <project_id> <service_key>"
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if ! command_exists supabase; then
        install_supabase_cli
    fi
    
    # Login to Supabase (if not already)
    echo -e "${YELLOW}🔐 Logging into Supabase...${NC}"
    supabase login
    
    # Link to remote project
    echo -e "${YELLOW}🔗 Linking to remote project...${NC}"
    cd "$ROOT_DIR"
    supabase link --project-ref "$PROJECT_ID"
    
    # Pull remote schema
    echo -e "${YELLOW}📥 Pulling remote schema...${NC}"
    supabase db pull
    
    # Apply custom schema if needed
    if [ -f "$ROOT_DIR/database/schema.sql" ]; then
        echo -e "${YELLOW}🔧 Do you want to apply custom schema to remote? (y/N)${NC}"
        read -r apply_schema
        if [[ $apply_schema =~ ^[Yy]$ ]]; then
            # This is dangerous in production, so we ask for confirmation
            echo -e "${RED}⚠️  WARNING: This will modify your production database!${NC}"
            echo -e "${YELLOW}Are you sure? (type 'yes' to confirm):${NC}"
            read -r confirm
            if [ "$confirm" = "yes" ]; then
                supabase db push
            else
                echo -e "${YELLOW}Skipping schema application.${NC}"
            fi
        fi
    fi
    
    # Get project URL and anon key
    PROJECT_URL="https://$PROJECT_ID.supabase.co"
    
    echo -e "${YELLOW}🔑 Please provide your Supabase anon key:${NC}"
    read -r ANON_KEY
    
    # Create .env file for remote
    cat > "$ROOT_DIR/.env.production" << EOF
# Remote Supabase Configuration
SUPABASE_URL=$PROJECT_URL
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_KEY=$SERVICE_KEY

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# Application Configuration
NODE_ENV=production
PORT=3000
APP_NAME=Admin Panel Service
APP_VERSION=1.0.0
TENANT_ID=default
ADMIN_EMAIL=admin@yourdomain.com

# Database Configuration (using Supabase)
DB_SSL=true

# Redis Configuration (if using external Redis)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
EOF
    
    echo -e "${GREEN}✅ Remote Supabase setup completed!${NC}"
    echo -e "${BLUE}📋 Connection details:${NC}"
    echo -e "  URL: ${YELLOW}$PROJECT_URL${NC}"
    echo -e "  Project ID: ${YELLOW}$PROJECT_ID${NC}"
    echo -e "  Dashboard: ${YELLOW}https://supabase.com/dashboard/project/$PROJECT_ID${NC}"
    echo ""
    echo -e "${BLUE}🔧 Environment file created: ${YELLOW}.env.production${NC}"
}

# Function to create initial admin user
create_admin_user() {
    echo -e "${YELLOW}👤 Do you want to create an initial admin user? (y/N)${NC}"
    read -r create_user
    
    if [[ $create_user =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📧 Enter admin email:${NC}"
        read -r admin_email
        
        echo -e "${YELLOW}🔒 Enter admin password:${NC}"
        read -s admin_password
        
        # Create user using Supabase CLI or curl
        echo -e "\n${YELLOW}🔄 Creating admin user...${NC}"
        
        if [ "$SETUP_TYPE" = "local" ]; then
            # For local setup, use direct SQL
            PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '$admin_email',
    crypt('$admin_password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
EOF
        else
            echo -e "${YELLOW}Please create the admin user manually through the Supabase dashboard.${NC}"
            echo -e "Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID/auth/users"
        fi
        
        echo -e "${GREEN}✅ Admin user setup completed!${NC}"
    fi
}

# Function to verify setup
verify_setup() {
    echo -e "${BLUE}🔍 Verifying setup...${NC}"
    
    # Test database connection
    if [ "$SETUP_TYPE" = "local" ]; then
        if PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "\dt" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Database connection: OK${NC}"
        else
            echo -e "${RED}❌ Database connection: FAILED${NC}"
        fi
    fi
    
    # Check if tables exist
    echo -e "${YELLOW}📊 Checking database tables...${NC}"
    if [ "$SETUP_TYPE" = "local" ]; then
        TABLES=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'api_keys', 'system_health_metrics');")
        if [ "$TABLES" -ge 3 ]; then
            echo -e "${GREEN}✅ Required tables: OK${NC}"
        else
            echo -e "${YELLOW}⚠️  Some required tables may be missing${NC}"
        fi
    fi
    
    echo -e "${GREEN}🎉 Setup verification completed!${NC}"
}

# Function to show next steps
show_next_steps() {
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo ""
    echo -e "1. ${YELLOW}Copy the appropriate environment file:${NC}"
    if [ "$SETUP_TYPE" = "local" ]; then
        echo -e "   cp .env.local .env"
    else
        echo -e "   cp .env.production .env"
    fi
    echo ""
    echo -e "2. ${YELLOW}Install API dependencies:${NC}"
    echo -e "   cd api && npm install"
    echo ""
    echo -e "3. ${YELLOW}Install Frontend dependencies:${NC}"
    echo -e "   cd frontend && npm install"
    echo ""
    echo -e "4. ${YELLOW}Start the services:${NC}"
    if [ "$SETUP_TYPE" = "local" ]; then
        echo -e "   docker-compose -f docker/docker-compose.yml up"
    else
        echo -e "   docker-compose -f docker/docker-compose.yml up -d"
    fi
    echo ""
    echo -e "5. ${YELLOW}Access the admin panel:${NC}"
    echo -e "   Frontend: http://localhost:3001"
    echo -e "   API: http://localhost:3000"
    echo ""
    echo -e "${GREEN}🎉 Happy coding!${NC}"
}

# Main execution
case $SETUP_TYPE in
    local)
        setup_local
        create_admin_user
        verify_setup
        show_next_steps
        ;;
    remote)
        setup_remote
        verify_setup
        show_next_steps
        ;;
    *)
        echo -e "${RED}❌ Invalid setup type. Use 'local' or 'remote'${NC}"
        echo "Usage: $0 [local|remote] [project_id] [service_key]"
        exit 1
        ;;
esac