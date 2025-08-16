# Manito Production Deployment Guide

This guide provides comprehensive instructions for deploying Manito to production environments.

## 🚀 Quick Start

For a quick production deployment:

```bash
# 1. Configure environment
cp .env.production .env.production.local
# Edit .env.production.local with your secrets

# 2. Deploy
./scripts/deployment/deploy-production.sh

# 3. Verify
curl http://localhost:3000/api/health
```

## 📋 Prerequisites

### System Requirements

- **Docker** 20.10+ and **Docker Compose** v2.0+
- **Linux/macOS** (Windows with WSL2 supported)
- **Minimum Resources**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage

### Dependencies

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y docker.io docker-compose curl

# macOS
brew install docker docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🔧 Configuration

### 1. Environment Files

Create environment-specific configuration:

```bash
# Production environment
cp .env.production .env.production.local

# Staging environment  
cp .env.staging .env.staging.local
```

### 2. Required Environment Variables

Edit your `.env.production.local` file:

```bash
# Security (REQUIRED - Generate strong secrets)
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
SESSION_SECRET=your-super-secure-session-secret-32-chars
POSTGRES_PASSWORD=your-secure-database-password

# Domain Configuration
CLIENT_URL=https://manito.yourdomain.com

# Database
DATABASE_URL=postgresql://manito_user:${POSTGRES_PASSWORD}@postgres:5432/manito

# Optional: AI Integration
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional: Monitoring
GRAFANA_ADMIN_PASSWORD=secure-grafana-password

# Optional: Notifications
WEBHOOK_URL=https://your-webhook-endpoint.com/notify
```

### 3. SSL Certificates (Production)

For HTTPS in production:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Add your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-private-key.pem nginx/ssl/key.pem

# Update nginx configuration
# Uncomment HTTPS server block in nginx/nginx.conf
```

## 🏗️ Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
# Full production deployment with backup
ENVIRONMENT=production BACKUP_ENABLED=true ./scripts/deployment/deploy-production.sh

# Quick deployment without backup
BACKUP_ENABLED=false ./scripts/deployment/deploy-production.sh

# Custom Docker tag
DOCKER_TAG=v1.2.3 ./scripts/deployment/deploy-production.sh
```

### Method 2: Manual Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Method 3: Individual Service Deployment

```bash
# Database only
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Application only
docker-compose -f docker-compose.prod.yml up -d manito-app

# Monitoring stack
docker-compose -f docker-compose.prod.yml up -d prometheus grafana
```

## 🔍 Health Checks & Verification

### Application Health

```bash
# Basic health check
curl http://localhost:3000/api/health

# Detailed health check (requires authentication)
curl "http://localhost:3000/api/health?detailed=true" -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Internal monitoring health check
curl http://localhost:3000/api/health -H "x-health-check: internal"
```

### Service Status

```bash
# Container status
docker-compose -f docker-compose.prod.yml ps

# Resource usage
docker-compose -f docker-compose.prod.yml top

# Logs
docker-compose -f docker-compose.prod.yml logs --tail=50 manito-app
docker-compose -f docker-compose.prod.yml logs --tail=50 postgres
docker-compose -f docker-compose.prod.yml logs --tail=50 redis
```

### Database Health

```bash
# PostgreSQL connection test
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U manito_user

# Database size and performance
docker-compose -f docker-compose.prod.yml exec postgres psql -U manito_user -d manito -c "SELECT * FROM performance_summary;"
```

## 📊 Monitoring & Observability

### Built-in Endpoints

- **Health Check**: `http://localhost:3000/api/health`
- **Metrics**: `http://localhost:3000/api/metrics`
- **Queue Status**: `http://localhost:3000/api/scan/queue`

### Optional Monitoring Stack

If deployed with monitoring enabled:

- **Grafana Dashboard**: `http://localhost:3001` (admin/admin123)
- **Prometheus Metrics**: `http://localhost:9090`
- **Application Logs**: `docker-compose logs -f manito-app`

### Log Monitoring

```bash
# Real-time application logs
docker-compose -f docker-compose.prod.yml logs -f manito-app

# Error logs only
docker-compose -f docker-compose.prod.yml logs --tail=100 manito-app | grep ERROR

# Performance logs
docker-compose -f docker-compose.prod.yml logs --tail=100 manito-app | grep -E "(scan|performance)"
```

## 🔄 Updates & Rollbacks

### Updating the Application

```bash
# Build new version
DOCKER_TAG=v1.2.4 ./scripts/deployment/deploy-production.sh

# Zero-downtime update (if using load balancer)
docker-compose -f docker-compose.prod.yml up -d --no-deps manito-app
```

### Rolling Back

```bash
# List available versions
./scripts/deployment/rollback.sh list

# Rollback application
./scripts/deployment/rollback.sh app 20241201_143022

# Rollback database (use with caution)
./scripts/deployment/rollback.sh database backups/20241201_120000/database.sql
```

## 🔒 Security Considerations

### Network Security

- Use HTTPS in production (configure SSL certificates)
- Configure firewall rules (only expose necessary ports)
- Use strong passwords and secrets
- Enable rate limiting (configured by default)

### Application Security

- JWT tokens expire in 24 hours
- Bcrypt password hashing with 12 rounds
- Helmet security headers enabled
- Input validation and sanitization
- Path traversal protection

### Infrastructure Security

```bash
# Regular security updates
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image manito-app:latest
```

## 🗄️ Backup & Recovery

### Automated Backups

Backups are created automatically during deployment if `BACKUP_ENABLED=true`:

```bash
# View available backups
ls -la backups/

# Manual backup
./scripts/backup.sh create

# Restore from backup
./scripts/backup.sh restore backups/20241201_120000
```

### Database Backups

```bash
# Manual database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U manito_user manito > backup-$(date +%Y%m%d).sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U manito_user -d manito < backup-20241201.sql
```

## 🐛 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs manito-app

# Check resource usage
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

**Database connection errors:**
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check connection string
echo $DATABASE_URL

# Reset database connection
docker-compose -f docker-compose.prod.yml restart postgres
```

**Performance issues:**
```bash
# Check system resources
docker stats

# Monitor scan queue
curl http://localhost:3000/api/scan/queue

# Check worker threads
docker-compose -f docker-compose.prod.yml exec manito-app node -e "console.log(require('os').cpus().length)"
```

### Debug Mode

Enable debug logging:

```bash
# Temporary debug mode
docker-compose -f docker-compose.prod.yml exec -e LOG_LEVEL=debug manito-app npm start

# Persistent debug mode
echo "LOG_LEVEL=debug" >> .env.production.local
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Performance Tuning

### Application Performance

- **Worker Threads**: Adjust `WORKER_THREADS_MAX` based on CPU cores
- **Concurrency**: Set `MAX_CONCURRENT_SCANS` based on memory
- **File Limits**: Configure `MAX_SCAN_SIZE_MB` for large repositories

### Database Performance

```bash
# View slow queries
docker-compose -f docker-compose.prod.yml exec postgres psql -U manito_user -d manito -c "SELECT * FROM slow_queries LIMIT 10;"

# Database statistics
docker-compose -f docker-compose.prod.yml exec postgres psql -U manito_user -d manito -c "SELECT * FROM table_stats;"
```

### Resource Limits

Adjust in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G        # Increase for large scans
      cpus: '2.0'       # Increase for better performance
```

## 🆘 Support

### Log Collection

For support, collect these logs:

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs --tail=500 manito-app > app-logs.txt

# System info
docker system info > system-info.txt
docker-compose -f docker-compose.prod.yml ps > container-status.txt

# Configuration (remove sensitive data)
cp .env.production.local env-config.txt
```

### Performance Reports

```bash
# Generate performance report
curl "http://localhost:3000/api/health?detailed=true" > health-report.json
curl http://localhost:3000/api/metrics > metrics-report.json
```

---

## 📞 Getting Help

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs via GitHub Issues
- **Security**: Report security issues privately
- **Community**: Join our Discord/Slack community

For additional help, include your deployment logs and system information when reporting issues.