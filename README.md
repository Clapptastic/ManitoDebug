# ManitoDebug - AI-Powered Code Analysis & Debugging Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

**ManitoDebug** is a comprehensive AI-powered code analysis and debugging tool that helps developers identify dependencies, conflicts, and potential issues in their codebases. Built with modern web technologies and featuring dynamic port management for seamless deployment.

## 🚀 Features

### Core Functionality
- **🔍 Intelligent Code Scanning**: AST-based analysis with dependency extraction
- **🤖 AI-Powered Analysis**: OpenAI, Anthropic, and local AI providers
- **📊 Real-time Metrics**: Performance monitoring and code quality insights
- **🔗 Dependency Mapping**: Visual dependency graphs and conflict detection
- **🌐 Dynamic Port Management**: Automatic port conflict resolution
- **📱 Modern Web UI**: React-based interface with real-time updates

### Advanced Features
- **🔄 Real-time Progress**: WebSocket-based live scanning updates
- **📈 Semantic Search**: PostgreSQL-powered full-text search
- **🎯 Conflict Detection**: Circular dependencies and unused imports
- **📋 Queue Management**: Asynchronous job processing
- **🔧 Migration System**: Database schema management
- **📊 Monitoring**: Prometheus and Grafana integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   PostgreSQL    │
│   (Dynamic Port)│◄──►│  (Dynamic Port) │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Redis Cache   │◄─────────────┘
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 15.x
- Redis 7.x
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Clapptastic/ManitoDebug.git
   cd ManitoDebug
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the full stack** (with dynamic port management)
   ```bash
   npm run dev
   ```

   The system will automatically:
   - Detect available ports
   - Resolve any port conflicts
   - Start server and client on optimal ports
   - Display the URLs for access

4. **Access the application**
   - **Client**: http://localhost:5173 (or dynamically assigned port)
   - **Server API**: http://localhost:3000 (or dynamically assigned port)
   - **Health Check**: http://localhost:3000/api/health

### Docker Deployment

#### Development Environment
```bash
# Start development environment with dynamic ports
docker-compose -f docker-compose.dev.yml up --build

# Access services
# Client: http://localhost:5173 (or assigned port)
# Server: http://localhost:3000 (or assigned port)
# Database: localhost:5432
# Redis: localhost:6379
```

#### Production Environment
```bash
# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start production environment
docker-compose -f docker-compose.prod.yml up --build -d

# Access services
# Application: http://localhost (via Nginx)
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

## 🔧 Dynamic Port Management

ManitoDebug features a sophisticated dynamic port management system that automatically:

- **Detects Port Conflicts**: Identifies when ports are in use
- **Resolves Conflicts**: Automatically assigns alternative ports
- **Provides Fallbacks**: Multiple fallback mechanisms for reliability
- **Maintains Consistency**: Ensures all components use the same configuration

### Port Configuration
- **Server**: Dynamic assignment (typically 3000-3010 range)
- **Client**: Dynamic assignment (typically 5173-5180 range)
- **WebSocket**: Dynamic assignment (typically 3001-3010 range)
- **Database**: Standard PostgreSQL port (5432)
- **Redis**: Standard Redis port (6379)

### Environment Variables
```bash
# Enable dynamic port management
ENABLE_DYNAMIC_PORTS=true
PORT_RANGE_START=3000
PORT_RANGE_END=3010

# Database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/manito_dev
REDIS_URL=redis://localhost:6379
```

## 📚 API Documentation

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/ports` - Dynamic port configuration
- `POST /api/scan` - Code scanning
- `POST /api/ai/analyze` - AI analysis
- `GET /api/search` - Semantic search
- `GET /api/metrics` - Performance metrics

### WebSocket Events
- `scan_progress` - Real-time scanning updates
- `analysis_complete` - AI analysis results
- `error` - Error notifications

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Dynamic Port Management Tests
```bash
node scripts/test-dynamic-port-management.js
```

### Client-Server Integration Tests
```bash
node scripts/test-client-server-integration.js
```

### AI Analysis Tests
```bash
node scripts/test-ai-analysis.js
```

## 📊 Monitoring

### Development Monitoring
- **Health Checks**: Automatic health monitoring
- **Logs**: Structured logging with timestamps
- **Metrics**: Performance metrics collection

### Production Monitoring
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Nginx**: Reverse proxy with SSL support

## 🔧 Configuration

### Environment Variables
```bash
# Core Configuration
NODE_ENV=development
PORT=3000
DEBUG=manito:*

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/manito_dev
REDIS_URL=redis://localhost:6379

# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Configuration Files
- `server/config/ports.js` - Port management configuration
- `client/vite.config.js` - Client build configuration
- `nginx/nginx.conf` - Reverse proxy configuration
- `monitoring/prometheus.yml` - Metrics configuration

## 🚀 Deployment

### Production Checklist
- [ ] Set environment variables
- [ ] Configure SSL certificates
- [ ] Set up database migrations
- [ ] Configure monitoring
- [ ] Set up backup strategy
- [ ] Configure logging
- [ ] Set up CI/CD pipeline

### Docker Deployment
```bash
# Build production image
docker build -f Dockerfile.prod -t manito-prod .

# Run with dynamic ports
docker run -p 3000-3010:3000-3010 -p 80:80 -p 443:443 manito-prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow the existing code style
- Add comprehensive tests
- Update documentation
- Use dynamic port management
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/Clapptastic/ManitoDebug/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Clapptastic/ManitoDebug/discussions)

## 🗺️ Roadmap

- [ ] Enhanced AI analysis capabilities
- [ ] Multi-language support
- [ ] Advanced dependency visualization
- [ ] Performance optimization
- [ ] Cloud deployment guides
- [ ] Plugin system
- [ ] Team collaboration features

---

**Built with ❤️ by the ManitoDebug Team**
