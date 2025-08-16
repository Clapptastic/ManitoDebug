# ManitoDebug Deployment Guide

## Overview

This guide covers deploying ManitoDebug in various environments with dynamic port management support. The application features automatic port conflict resolution and flexible deployment options.

## 🚀 Quick Deployment Options

### 1. Local Development (Recommended for Development)

```bash
# Clone and setup
git clone https://github.com/Clapptastic/ManitoDebug.git
cd ManitoDebug
npm install

# Start with dynamic port management
npm run dev
```

**Features:**
- ✅ Automatic port conflict resolution
- ✅ Hot reloading for development
- ✅ Full debugging capabilities
- ✅ Real-time error reporting

### 2. Docker Development Environment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Access services
# Client: http://localhost:5173 (or assigned port)
# Server: http://localhost:3000 (or assigned port)
```

### 3. Docker Production Environment

```bash
# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start production environment
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔧 Dynamic Port Management

### How It Works

ManitoDebug uses a sophisticated port management system that:

1. **Detects Available Ports**: Scans port ranges to find available ports
2. **Resolves Conflicts**: Automatically assigns alternative ports when conflicts occur
3. **Provides Fallbacks**: Multiple fallback mechanisms ensure reliability
4. **Maintains Consistency**: All components use the same port configuration

### Port Configuration

| Service | Default Port | Dynamic Range | Description |
|---------|-------------|---------------|-------------|
| Server | 3000 | 3000-3010 | API server |
| Client | 5173 | 5173-5180 | React development server |
| WebSocket | 3001 | 3001-3010 | Real-time communication |
| Database | 5432 | Fixed | PostgreSQL |
| Redis | 6379 | Fixed | Cache layer |
| Monitoring | 9090 | 9090-9100 | Prometheus metrics |

### Environment Variables

```bash
# Enable dynamic port management
ENABLE_DYNAMIC_PORTS=true
PORT_RANGE_START=3000
PORT_RANGE_END=3010

# Client port range
CLIENT_PORT_RANGE_START=5173
CLIENT_PORT_RANGE_END=5180

# WebSocket port range
WEBSOCKET_PORT_RANGE_START=3001
WEBSOCKET_PORT_RANGE_END=3010
```

## 🐳 Docker Deployment

### Development Environment

**File:** `docker-compose.dev.yml`

```yaml
services:
  manito-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000-3010:3000-3010"  # Server port range
      - "5173-5180:5173-5180"  # Client port range
      - "9229:9229"            # Debug port
    environment:
      - ENABLE_DYNAMIC_PORTS=true
      - PORT_RANGE_START=3000
      - PORT_RANGE_END=3010
```

**Features:**
- Hot reloading
- Volume mounting for development
- Debug port exposure
- Dynamic port assignment

### Production Environment

**File:** `docker-compose.prod.yml`

```yaml
services:
  manito-prod:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000-3010:3000-3010"  # Server port range
      - "80:80"                # HTTP port
      - "443:443"              # HTTPS port
    environment:
      - NODE_ENV=production
      - ENABLE_DYNAMIC_PORTS=true
```

**Features:**
- Production optimizations
- Nginx reverse proxy
- SSL support
- Monitoring integration

## 🌐 Cloud Deployment

### AWS Deployment

#### Using AWS ECS

```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker build -t manito-prod .
docker tag manito-prod:latest $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/manito:latest
docker push $AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/manito:latest

# Deploy with ECS
aws ecs create-service \
  --cluster manito-cluster \
  --service-name manito-service \
  --task-definition manito-task \
  --desired-count 2
```

#### Using AWS App Runner

```yaml
# apprunner.yaml
version: 1.0
runtime: nodejs20
build:
  commands:
    build:
      - npm install
      - npm run build
run:
  runtime-version: 20
  command: npm start
  network:
    port: 3000
    env: PORT
```

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/manito
gcloud run deploy manito \
  --image gcr.io/PROJECT_ID/manito \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

#### Using GKE

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: manito
spec:
  replicas: 3
  selector:
    matchLabels:
      app: manito
  template:
    metadata:
      labels:
        app: manito
    spec:
      containers:
      - name: manito
        image: gcr.io/PROJECT_ID/manito:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ENABLE_DYNAMIC_PORTS
          value: "true"
```

### Azure Deployment

#### Using Azure Container Instances

```bash
# Deploy to ACI
az container create \
  --resource-group myResourceGroup \
  --name manito \
  --image manito:latest \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    ENABLE_DYNAMIC_PORTS=true
```

#### Using Azure Kubernetes Service

```yaml
# azure-k8s.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: manito
spec:
  replicas: 3
  selector:
    matchLabels:
      app: manito
  template:
    metadata:
      labels:
        app: manito
    spec:
      containers:
      - name: manito
        image: manito:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: ENABLE_DYNAMIC_PORTS
          value: "true"
```

## 🔒 Security Configuration

### Environment Variables

```bash
# Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
COOKIE_SECRET=your-super-secret-cookie-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
```

### SSL/TLS Configuration

#### Nginx SSL Configuration

```nginx
# nginx/ssl.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://manito-prod:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Let's Encrypt Integration

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Observability

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'manito'
    static_configs:
      - targets: ['manito-prod:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "ManitoDebug Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

### Health Checks

```bash
# Application health check
curl -f http://localhost:3000/api/health

# Database health check
curl -f http://localhost:3000/api/health/database

# Redis health check
curl -f http://localhost:3000/api/health/redis
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy ManitoDebug

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:dynamic-ports

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -f Dockerfile.prod -t manito-prod .
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag manito-prod:latest ${{ secrets.REGISTRY }}/manito:latest
          docker push ${{ secrets.REGISTRY }}/manito:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy to your cloud platform
          # Example for AWS ECS:
          aws ecs update-service --cluster manito-cluster --service manito-service --force-new-deployment
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm test
    - npm run test:dynamic-ports

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -f Dockerfile.prod -t manito-prod .
    - docker tag manito-prod:latest $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest

deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
    # Add your deployment commands here
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000

# Kill process using port
sudo kill -9 $(lsof -t -i:3000)

# Test dynamic port management
node scripts/test-dynamic-port-management.js
```

#### Database Connection Issues

```bash
# Check database connectivity
curl -f http://localhost:3000/api/health/database

# Test database connection
psql -h localhost -U manito -d manito_dev -c "SELECT 1;"
```

#### Docker Issues

```bash
# Clean up Docker resources
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check container logs
docker-compose logs manito-dev
```

### Performance Optimization

#### Production Optimizations

```bash
# Node.js optimizations
export NODE_OPTIONS="--max-old-space-size=2048"
export UV_THREADPOOL_SIZE=8

# Database optimizations
export POSTGRES_MAX_CONNECTIONS=100
export REDIS_MAX_MEMORY=256mb
```

#### Monitoring Alerts

```yaml
# monitoring/alerts.yml
groups:
  - name: manito_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
```

## 📚 Additional Resources

- [Dynamic Port Management Documentation](docs/DYNAMIC_PORT_MANAGEMENT_SUMMARY.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Configuration Guide](docs/CONFIGURATION_GUIDE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

## 🆘 Support

For deployment issues:
- Check the [troubleshooting section](#-troubleshooting)
- Review [GitHub Issues](https://github.com/Clapptastic/ManitoDebug/issues)
- Join [GitHub Discussions](https://github.com/Clapptastic/ManitoDebug/discussions)

---

**Happy Deploying! 🚀**
