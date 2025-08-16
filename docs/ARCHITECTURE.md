# 🏗️ ManitoDebug Architecture Documentation

## System Overview

ManitoDebug is a modern, AI-powered code analysis platform built with a microservices-inspired architecture. The system consists of multiple interconnected components that work together to provide comprehensive code analysis, visualization, and insights.

## 📊 Current Implementation Status

### ✅ **Production Ready (90-100% Complete)**
- **Core Code Scanner** - AST parsing, dependency analysis, metrics
- **React Client Application** - Modern UI with real-time updates  
- **Express API Server** - RESTful endpoints, WebSocket support
- **Command Line Interface** - Full-featured CLI tool
- **VS Code Extension** - Complete IDE integration
- **Development Environment** - Docker, hot reloading, interactive launcher
- **Graph Visualization** - D3.js interactive dependency graphs

### ⚠️ **Partial Implementation (40-70% Complete)**
- **AI Integration** - Mock responses, needs real provider connection
- **Database Layer** - Infrastructure ready, schemas missing
- **Testing Framework** - Suite exists but 21/38 tests failing
- **Security Layer** - Basic validation, missing authentication

### ❌ **Missing/Placeholder (0-30% Complete)**  
- **User Management** - Authentication, permissions, projects
- **Real-time Collaboration** - Multi-user features
- **CI/CD Pipeline** - Automated testing and deployment
- **Advanced Analytics** - Historical data, trends, benchmarks

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ManitoDebug Platform                       │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Client Layer                                               │
│  ├── React 18 SPA (Vite)                                      │
│  ├── D3.js Visualizations                                     │
│  ├── WebSocket Client                                         │
│  └── Service Workers (Future)                                 │
├─────────────────────────────────────────────────────────────────┤
│  🔗 API Gateway                                                │
│  ├── Express.js REST API                                      │
│  ├── WebSocket Server                                         │
│  ├── Input Validation (Joi)                                   │
│  └── CORS & Security Middleware                               │
├─────────────────────────────────────────────────────────────────┤
│  🧠 Business Logic Layer                                       │
│  ├── Core Scanner Engine                                      │
│  ├── AI Analysis Service                                      │
│  ├── Dependency Graph Builder                                 │
│  └── Metrics Calculator                                       │
├─────────────────────────────────────────────────────────────────┤
│  💾 Data Layer                                                │
│  ├── PostgreSQL (Primary DB)                                 │
│  ├── Redis (Caching)                                         │
│  ├── File System (Temp Storage)                              │
│  └── S3 Compatible (Future)                                  │
├─────────────────────────────────────────────────────────────────┤
│  🔧 Integration Layer                                          │
│  ├── CLI Tools                                               │
│  ├── VS Code Extension                                       │
│  ├── Webhook Endpoints                                       │
│  └── Third-party APIs                                        │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ Component Architecture

### Client Application (`client/`)

**Framework**: React 18 with Vite
**State Management**: React Hooks + Context
**Styling**: Tailwind CSS with custom components
**Real-time**: WebSocket integration
**Testing**: Jest + Testing Library

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── GraphVisualization.jsx    ✅ Complete - D3.js interactive graphs
│   │   ├── SettingsModal.jsx         ✅ Complete - Full configuration UI
│   │   ├── AIPanel.jsx               ⚠️  UI complete, backend mock
│   │   ├── MetricsPanel.jsx          ✅ Complete - Data visualization
│   │   ├── Toast.jsx                 ✅ Complete - Notification system
│   │   ├── Tooltip.jsx               ✅ Complete - Interactive help
│   │   ├── Loading.jsx               ✅ Complete - Multiple loading states
│   │   └── ConfirmDialog.jsx         ✅ Complete - User confirmations
│   ├── hooks/
│   │   └── useWebSocket.js           ✅ Complete - Real-time connection
│   ├── App.jsx                       ✅ Complete - Main application
│   └── main.jsx                      ✅ Complete - Application entry
├── index.html                        ✅ Complete - Modern HTML5
├── vite.config.js                    ✅ Complete - Build configuration
└── package.json                      ✅ Complete - Dependencies
```

### Server Application (`server/`)

**Framework**: Express.js with Winston logging
**Real-time**: WebSocket (ws library)
**Validation**: Joi schema validation
**Testing**: Jest + Supertest
**Status**: 🟢 Production Ready

```
server/
├── app.js                   ✅ Complete - Express server setup
├── index.js                 ✅ Complete - Server entry point  
├── routes/                  ✅ Complete - API endpoint handlers
├── middleware/              ✅ Complete - CORS, logging, validation
├── websocket/               ✅ Complete - Real-time updates
└── tests/                   ⚠️  Exist but some failing
```

### Core Engine (`core/`)

**Purpose**: Code analysis and scanning logic
**Parser**: Acorn (JavaScript AST)
**Analysis**: Dependency graphs, metrics, complexity
**Status**: 🟢 Fully Functional

```
core/
├── scanner.js               ✅ Complete - Main scanning engine
├── index.js                 ✅ Complete - Module exports
└── tests/                   ⚠️  Basic tests, needs expansion
```

**Key Features Implemented**:
- JavaScript/TypeScript file scanning
- Import/export relationship analysis  
- Circular dependency detection
- Code complexity calculation (cyclomatic)
- File metrics (size, lines, functions)
- Dependency graph generation

### Command Line Interface (`cli/`)

**Framework**: Node.js with Commander.js
**Features**: Scan command, vibe check, exports
**Status**: 🟢 Complete

```
cli/
├── index.js                 ✅ Complete - Main CLI entry
├── vibe.js                  ✅ Complete - Quick health check
└── tests/                   ✅ Complete - CLI testing
```

### VS Code Extension (`vscode-extension/`)

**API**: VS Code Extension API
**Features**: Commands, tree view, WebSocket integration
**Status**: 🟢 Complete

```
vscode-extension/
├── extension.js             ✅ Complete - Main extension logic
├── package.json             ✅ Complete - Extension manifest
└── media/                   ✅ Complete - Icons and assets
```

## 🔌 Data Flow Architecture

### 1. **Code Scanning Flow**
```
User Input → CLI/UI → Core Scanner → AST Parsing → 
Dependency Analysis → Metrics Calculation → Database Storage → 
WebSocket Broadcast → UI Update
```

### 2. **Real-time Updates Flow**  
```
File Change → Core Scanner → WebSocket Server → 
Connected Clients → UI State Update → Graph Re-render
```

### 3. **AI Analysis Flow** (Partially Implemented)
```
Scan Results → AI Service → Provider API → 
Response Processing → Confidence Scoring → 
Database Storage → UI Display
```

## 🗄️ Database Architecture

### Current State: Infrastructure Ready, Schema Missing

**Primary Database**: PostgreSQL 15
**Caching Layer**: Redis 7  
**Status**: ⚠️ Containers configured, schemas not implemented

### Proposed Schema (Not Yet Implemented)

```sql
-- Projects and scans
projects (id, name, path, created_at, settings)
scans (id, project_id, status, started_at, completed_at, results)
files (id, scan_id, path, size, complexity, metrics)
dependencies (id, scan_id, from_file, to_file, type)
conflicts (id, scan_id, type, severity, file, line, message)

-- User management (Future)
users (id, email, name, role, created_at)
project_members (project_id, user_id, role, permissions)

-- AI and analytics (Future)  
ai_analyses (id, scan_id, provider, prompt, response, confidence)
metrics_history (id, project_id, metric_name, value, timestamp)
```

## 🔐 Security Architecture

### Current Implementation
- **Input Validation**: Joi schemas for API endpoints
- **CORS**: Configured for development and production
- **File Access**: Limited to specified directories
- **Logging**: Winston with structured logging

### Missing Security Features
- **Authentication**: No user authentication system
- **Authorization**: No role-based access control  
- **Rate Limiting**: No API rate limiting
- **Input Sanitization**: Basic but needs strengthening
- **Session Management**: No session handling
- **HTTPS**: Not enforced in production config

## 🚀 Deployment Architecture

### Development Environment
```
Docker Compose:
├── manito-dev              # Main application container
├── postgres-dev            # Development database  
├── redis-dev              # Development cache
├── test-runner            # Automated testing (optional)
└── dev-tools              # Development utilities (optional)
```

### Production Environment (Configured but not deployed)
```
Docker Swarm/Kubernetes:
├── Load Balancer          # NGINX or similar
├── App Instances (3x)     # Horizontal scaling
├── PostgreSQL Cluster    # Primary + Read Replicas  
├── Redis Cluster         # High availability cache
├── File Storage          # S3 compatible storage
└── Monitoring Stack      # Prometheus + Grafana
```

## 🔄 Integration Points

### Completed Integrations
- **VS Code**: Full extension with commands and tree views
- **CLI**: Standalone command-line tool
- **WebSocket**: Real-time UI updates
- **Docker**: Complete containerization

### Planned Integrations (Not Implemented)
- **GitHub Actions**: CI/CD pipeline
- **Webhook Endpoints**: External system notifications
- **Slack/Teams**: Team collaboration notifications
- **AI Providers**: OpenAI, Claude, local models
- **Package Managers**: npm, yarn, pnpm analysis

## 📈 Performance Architecture

### Current Optimizations
- **Client**: Vite for fast builds, D3.js optimized animations
- **Server**: Winston logging, efficient AST parsing
- **Database**: Connection pooling ready, indexing planned
- **Caching**: Redis integration prepared
- **Docker**: Multi-stage builds, volume caching

### Performance Bottlenecks (Identified)
1. **Large Codebases**: Scanner may struggle with 10,000+ files
2. **Graph Rendering**: D3.js performance degrades after 1000+ nodes  
3. **Memory Usage**: No streaming for large file processing
4. **Database Queries**: No query optimization implemented yet

## 🧪 Testing Architecture

### Current State: Broken but Recoverable
- **Unit Tests**: Jest configured but ESM compatibility issues
- **Integration Tests**: Some server tests working
- **E2E Tests**: Not implemented
- **Coverage**: 0% due to test failures

### Test Structure
```
*/tests/
├── unit/                   # Component and function tests
├── integration/            # API endpoint tests  
├── e2e/                   # Full workflow tests (missing)
└── fixtures/              # Test data and mocks
```

## 🔮 Future Architecture Considerations

### Microservices Evolution
The current monolithic structure could evolve into microservices:
- **Scanner Service**: Core analysis engine
- **AI Service**: Machine learning and insights
- **Notification Service**: Real-time updates and alerts
- **User Service**: Authentication and authorization
- **Analytics Service**: Data processing and reporting

### Scalability Improvements
- **Queue System**: Redis/Bull for background processing
- **Event Streaming**: Apache Kafka for large-scale events
- **API Gateway**: Kong or similar for routing and rate limiting  
- **Service Mesh**: Istio for microservice communication

## 📋 Technical Debt Assessment

### High Priority Technical Debt
1. **Test Suite Recovery**: Fix Jest ESM compatibility
2. **Error Handling**: Add React error boundaries  
3. **Security Gaps**: Implement authentication layer
4. **Database Migration**: Create schema and migrations
5. **API Consistency**: Standardize response formats

### Medium Priority Technical Debt  
1. **Code Splitting**: Implement lazy loading for client
2. **Monitoring**: Add APM and error tracking
3. **Documentation**: API documentation and examples
4. **Performance**: Optimize large file handling
5. **Accessibility**: WCAG compliance improvements

### Low Priority Technical Debt
1. **Internationalization**: Multi-language support structure
2. **Progressive Web App**: Service workers and offline support
3. **Analytics**: User behavior tracking and insights
4. **Plugin Architecture**: Extensible analysis framework

## 🎯 Next Steps Recommendation

Based on this architectural analysis, the recommended development priorities are:

1. **Fix Test Suite** (Critical) - Enable quality assurance
2. **Implement Database Schema** (Critical) - Enable data persistence
3. **Add Authentication** (High) - Enable user management
4. **Connect Real AI** (High) - Deliver on core value proposition
5. **Performance Optimization** (Medium) - Handle large codebases

This architecture provides a solid foundation for scaling ManitoDebug into an enterprise-grade code analysis platform.