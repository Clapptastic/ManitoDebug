# ManitoDebug 🔍

> AI-powered code analysis and debugging platform for modern development teams

ManitoDebug is a comprehensive code analysis platform that combines AST parsing, dependency graph visualization, AI-powered insights, and real-time collaboration features to help developers understand, debug, and optimize their codebases.

## ✨ Features

- 🧠 **AI-Powered Analysis** - Get intelligent suggestions and code insights
- 📊 **Dependency Visualization** - Interactive dependency graphs and metrics
- ⚡ **Real-time Collaboration** - WebSocket-powered live updates
- 🔍 **Code Scanner** - Deep AST analysis with conflict detection
- 📱 **Modern UI/UX** - Responsive design with dark theme
- 🐳 **Docker Support** - Production-ready containerization
- 🔧 **VS Code Extension** - Integrated development experience
- 🖥️ **CLI Tools** - Automation and CI/CD integration
- 🧪 **Comprehensive Testing** - Jest-based testing framework

## 🏗️ Architecture

```
manito-package/
├── server/          # Express.js API server with WebSocket
├── client/          # React 18 frontend application
├── core/            # Code scanning engine with AST parsing
├── cli/             # Command-line interface tools
├── vscode-extension/# VS Code extension
├── docs/            # Documentation and mockups
├── docker-compose.yml
├── Dockerfile
└── jest.config.js   # Testing configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/[username]/ManitoDebug.git
cd ManitoDebug

# Install dependencies
npm install --legacy-peer-deps

# Start development servers
npm run dev
```

### Using Docker

```bash
# Build and start with Docker Compose
docker-compose up --build

# Or build production image
docker build -t manitodebug .
docker run -p 3000:3000 -p 5173:5173 manitodebug
```

## 📋 Available Scripts

### Development
- `npm run dev` - Start development servers (client + server)
- `npm run build` - Build for production
- `npm start` - Start production server

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage reports
- `npm run test:server` - Test server only
- `npm run test:client` - Test client only

### Quality & Linting
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript checks

### CLI Commands
```bash
# Scan a project
npx manito scan ./src

# Detect codebase "vibe"
npx manito vibe ./src

# Start development server
npx manito serve

# Export analysis results
npx manito export ./src --format json --output results.json
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server configuration
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# AI provider settings (optional)
AI_PROVIDER=local
AI_API_KEY=your_api_key_here
```

### VS Code Extension
1. Open the `vscode-extension` folder in VS Code
2. Press `F5` to launch extension development host
3. Use commands via Command Palette (`Cmd+Shift+P`):
   - `Manito: Scan Workspace`
   - `Manito: Show Dependency Graph`
   - `Manito: Open Dashboard`

## 📊 Features Deep Dive

### Code Scanner Engine
- **AST Parsing** - Uses Acorn parser for JavaScript/TypeScript analysis
- **Dependency Tracking** - Maps import/export relationships
- **Circular Dependencies** - Detects and reports dependency cycles
- **Complexity Analysis** - Calculates cognitive complexity metrics
- **Conflict Detection** - Identifies potential code issues

### AI Integration
- **Code Analysis** - AI-powered code quality assessment
- **Suggestions** - Intelligent refactoring recommendations
- **Confidence Scoring** - Reliability metrics for AI suggestions
- **Multiple Providers** - Support for various AI services

### Real-time Features
- **Live Updates** - WebSocket-powered real-time scan results
- **Collaborative Analysis** - Multiple users can analyze simultaneously
- **Progress Tracking** - Real-time scan progress indicators

## 🧪 Testing

The project includes comprehensive test suites:

```bash
# Run specific test suites
npm run test:server    # API endpoints and WebSocket tests
npm run test:client    # React component tests
npm run test:core      # Scanner engine tests
npm run test:cli       # Command-line interface tests

# Generate coverage reports
npm run test:coverage
```

Testing stack:
- **Jest** - Test framework
- **Testing Library** - React component testing
- **Supertest** - API endpoint testing
- **JSDOM** - DOM environment for React tests

## 🐳 Docker Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
# Build production image
docker build -t manitodebug:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  manitodebug:latest
```

### Multi-stage Build
The Dockerfile includes optimized multi-stage build:
- **Base stage** - Common dependencies
- **Dependencies stage** - Install all deps
- **Builder stage** - Build applications
- **Runner stage** - Production runtime

## 🔌 API Reference

### Health Check
```http
GET /api/health
```

### Code Scanning
```http
POST /api/scan
Content-Type: application/json

{
  "path": "./src",
  "options": {
    "patterns": ["**/*.{js,jsx,ts,tsx}"],
    "excludePatterns": ["node_modules/**"]
  }
}
```

### AI Analysis
```http
POST /api/ai/send
Content-Type: application/json

{
  "message": "Analyze this code",
  "provider": "local"
}
```

### Dependency Graph
```http
GET /api/graph/:scanId?
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style (use `npm run lint`)
- Add tests for new features
- Update documentation as needed
- Ensure Docker builds work
- Test VS Code extension functionality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies (React 18, Express.js, Node.js)
- AST parsing powered by Acorn
- UI components inspired by modern design systems
- Docker containerization for easy deployment
- VS Code extension API for developer integration

## 📞 Support

For questions, issues, or contributions:
- 🐛 [Report bugs](https://github.com/[username]/ManitoDebug/issues)
- 💡 [Request features](https://github.com/[username]/ManitoDebug/issues)
- 📖 [Read documentation](https://github.com/[username]/ManitoDebug/wiki)

---

**ManitoDebug** - Empowering developers with AI-powered code analysis 🚀
