# ManitoDebug - AI-Powered Code Analysis Platform

[![Docker Pulls](https://img.shields.io/docker/pulls/clapptastic/manito-debug)](https://hub.docker.com/r/clapptastic/manito-debug)
[![Docker Image Size](https://img.shields.io/docker/image-size/clapptastic/manito-debug/latest)](https://hub.docker.com/r/clapptastic/manito-debug)
[![Docker Version](https://img.shields.io/docker/v/clapptastic/manito-debug/latest)](https://hub.docker.com/r/clapptastic/manito-debug)

## 🚀 Quick Start

### Production Deployment

```bash
# Pull the latest production image
docker pull clapptastic/manito-debug:latest

# Run with Docker Compose (recommended)
docker-compose -f docker-compose.prod.yml up -d

# Or run standalone
docker run -d \
  --name manito-debug \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379 \
  clapptastic/manito-debug:latest
```

### Development Environment

```bash
# Pull the development image
docker pull clapptastic/manito-debug:dev

# Run with development Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Available Tags

| Tag | Description | Size |
|-----|-------------|------|
| `latest` | Production-ready image | ~453MB |
| `v1.1.0` | Versioned production release | ~453MB |
| `dev` | Development environment with tools | ~1.88GB |

## 🏗️ Architecture

ManitoDebug is a comprehensive AI-powered code analysis platform that provides:

- **🔍 Intelligent Code Scanning**: AST-based dependency analysis
- **🤖 AI-Powered Insights**: Real-time code quality assessment
- **📊 Interactive Visualizations**: D3.js dependency graphs
- **🔒 Security Analysis**: Vulnerability detection and assessment
- **📈 Performance Metrics**: Code complexity and maintainability analysis
- **🎯 Actionable Recommendations**: AI-generated improvement suggestions

## 🛠️ Features

### Core Capabilities
- **Multi-language Support**: JavaScript, TypeScript, React, Node.js
- **Real-time Analysis**: WebSocket-powered live updates
- **Comprehensive Reporting**: Quality metrics, architecture insights, security assessment
- **Interactive UI**: Modern React-based dashboard
- **API Integration**: RESTful API for programmatic access

### AI Analysis
- **Quality Metrics**: Complexity, maintainability, readability scores
- **Architecture Patterns**: Design pattern detection and analysis
- **Security Assessment**: Vulnerability scanning and risk assessment
- **Performance Analysis**: Bottleneck identification and optimization suggestions
- **Technical Debt**: Comprehensive debt analysis and remediation plans

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `ANTHROPIC_API_KEY` | Anthropic API key | Optional |

### Volume Mounts

```bash
# Scan workspace for project analysis
-v /path/to/projects:/app/scan-workspace:ro

# Persistent logs
-v manito-logs:/app/logs

# Database data
-v postgres-data:/var/lib/postgresql/data

# Redis data
-v redis-data:/data
```

## 🐳 Docker Compose Examples

### Production Stack

```yaml
version: '3.8'
services:
  manito-app:
    image: clapptastic/manito-debug:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://manito_user:password@postgres:5432/manito
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./projects:/app/scan-workspace:ro
      - manito-logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: manito
      POSTGRES_USER: manito_user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
  manito-logs:
```

### Development Stack

```yaml
version: '3.8'
services:
  manito-dev:
    image: clapptastic/manito-debug:dev
    ports:
      - "3000:3000"
      - "5173:5173"
    environment:
      - NODE_ENV=development
    volumes:
      - ./server:/app/server:cached
      - ./client:/app/client:cached
      - ./core:/app/core:cached
      - ./scan-workspace:/app/scan-workspace:rw
```

## 🔍 Usage Examples

### Analyze a Project

```bash
# Start the application
docker run -d --name manito-debug clapptastic/manito-debug:latest

# Access the web interface
open http://localhost:3000

# Upload a project for analysis
curl -X POST http://localhost:3000/api/upload \
  -F "file=@project.zip"

# Get AI-powered analysis
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"path": "./project", "options": {"patterns": ["**/*.js"]}}'
```

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/scan` - Code scanning
- `POST /api/upload` - File upload and analysis
- `POST /api/ai/analyze` - AI-powered analysis
- `GET /api/graph/:scanId` - Dependency graph data
- `GET /api/metrics` - System metrics

## 🔒 Security

- **Non-root user**: Runs as `appuser` (UID 1001)
- **Security updates**: Regular Alpine Linux updates
- **Minimal attack surface**: Multi-stage builds
- **Health checks**: Built-in health monitoring
- **Resource limits**: Configurable memory and CPU limits

## 📊 Monitoring

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/health

# Docker health check
docker inspect --format='{{.State.Health.Status}}' manito-debug
```

### Logs

```bash
# View application logs
docker logs manito-debug

# Follow logs in real-time
docker logs -f manito-debug
```

## 🚀 Performance

### Resource Requirements

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| Application | 0.5-1.5 cores | 1-2GB | 500MB |
| PostgreSQL | 0.25-1.0 cores | 512MB-1GB | 1GB+ |
| Redis | 0.1-0.5 cores | 128MB-512MB | 100MB+ |

### Optimization Tips

- Use volume mounts for persistent data
- Configure appropriate resource limits
- Enable Redis for caching
- Use production PostgreSQL settings
- Monitor memory usage and adjust limits

## 🔄 Updates

### Updating the Application

```bash
# Pull latest image
docker pull clapptastic/manito-debug:latest

# Stop current container
docker stop manito-debug

# Remove old container
docker rm manito-debug

# Start with new image
docker run -d --name manito-debug clapptastic/manito-debug:latest
```

### Rolling Updates

```bash
# Zero-downtime update with Docker Compose
docker-compose pull
docker-compose up -d --no-deps manito-app
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure port 3000 is available
2. **Database connection**: Verify DATABASE_URL is correct
3. **Memory issues**: Increase container memory limits
4. **Permission errors**: Check volume mount permissions

### Debug Mode

```bash
# Run with debug logging
docker run -e LOG_LEVEL=debug clapptastic/manito-debug:latest

# Access container shell
docker exec -it manito-debug /bin/bash
```

## 📚 Documentation

- [GitHub Repository](https://github.com/Clapptastic/ManitoDebug)
- [API Documentation](https://github.com/Clapptastic/ManitoDebug/blob/main/docs/API_DOCUMENTATION.md)
- [Architecture Guide](https://github.com/Clapptastic/ManitoDebug/blob/main/docs/ARCHITECTURE.md)
- [Development Guide](https://github.com/Clapptastic/ManitoDebug/blob/main/DEVELOPMENT.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Clapptastic/ManitoDebug/blob/main/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Clapptastic/ManitoDebug/blob/main/LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Clapptastic/ManitoDebug/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Clapptastic/ManitoDebug/discussions)
- **Documentation**: [Project Wiki](https://github.com/Clapptastic/ManitoDebug/wiki)

---

**Made with ❤️ by the ManitoDebug Team**
