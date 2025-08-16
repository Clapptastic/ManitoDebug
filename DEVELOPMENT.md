# Development Guide

## Docker Development Environment

### Fixed: Docker Profile Flag Issue ✅

**Issue**: The `--profile` flag was being used incorrectly in Docker Compose commands, causing "unknown flag" errors.

**Root Cause**: The `--profile` flag needs to be placed before the `up` command, not after it.

**Fix Applied**: Updated `scripts/dev-docker.sh` to properly position the `--profile` flag:
- Changed from: `docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up --profile $PROFILES`
- Changed to: `docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME --profile $PROFILES up`

**Status**: ✅ **RESOLVED** - Docker profiles now work correctly

### Using Docker Profiles

The development environment supports different profiles for different use cases:

#### Available Profiles

- **`testing`** - Includes automated test runner with file watching
- **`tools`** - Includes development tools container for debugging

#### Usage Examples

```bash
# Start with testing profile
./scripts/dev-docker.sh up --testing

# Start with tools profile  
./scripts/dev-docker.sh up --tools

# Start with both profiles
./scripts/dev-docker.sh up --testing --tools

# Run tests only
./scripts/dev-docker.sh test
```

#### Interactive Development

For the easiest experience, use the interactive launcher:

```bash
npm run dev
```

This will guide you through choosing the right development setup including Docker profiles.

### Docker Services

The development environment includes:

- **manito-dev** - Main application with hot reloading
- **postgres-dev** - PostgreSQL database with sample data
- **redis-dev** - Redis caching layer
- **test-runner** - Automated test runner (testing profile)
- **dev-tools** - Development tools container (tools profile)

### Troubleshooting

If you encounter Docker issues:

1. **Check Docker is running**: `docker info`
2. **Clean up containers**: `./scripts/dev-docker.sh clean`
3. **Rebuild images**: `./scripts/dev-docker.sh build`
4. **Check logs**: `./scripts/dev-docker.sh logs`

### Port Usage

- **3000** - Server API
- **5173** - Vite dev server (client)
- **5432** - PostgreSQL
- **6379** - Redis
- **9229** - Node.js debugger (when using debug mode)

### Recent Fixes

#### ✅ **ToastProvider Context Issue** (Dec 2024)
**Issue**: React error "useToast must be used within a ToastProvider" when starting the application.

**Root Cause**: The `ToastProvider` was placed inside the `AppContent` component, but the `useToast` hook was being called before the provider was rendered.

**Fix Applied**: Moved `ToastProvider` to wrap the entire `AppContent` component in the main `App` component.

**Status**: ✅ **RESOLVED** - Toast notifications now work correctly