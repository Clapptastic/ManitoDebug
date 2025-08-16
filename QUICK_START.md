# 🚀 ManitoDebug Quick Start Guide

Get up and running with ManitoDebug in minutes using our interactive development launcher!

## 🎯 One Command to Rule Them All

```bash
npm run dev
```

This launches an **interactive CLI** that helps you choose the perfect development setup for your needs.

## 🎮 Interactive Development Launcher

When you run `npm run dev`, you'll see a beautiful interface that:

### 📊 **System Status Check**
- ✅ Checks Node.js version (20+ required)
- ✅ Verifies Docker and Docker Compose availability
- ✅ Shows port usage (3000, 5173, 5432, 6379)
- ✅ Lists any running ManitoDebug containers

### 🎯 **Development Mode Options**

**1. 💻 Local Development** *(Recommended for quick starts)*
- Runs directly on your machine
- Fast startup and hot reloading
- Server: `http://localhost:3000`
- Client: `http://localhost:5173`

**2. 🐳 Docker Development** *(Recommended for full experience)*
- Complete containerized environment
- PostgreSQL database with sample data
- Redis caching layer
- All services with hot reloading
- Perfect for team development

**3. 🐳 Docker (Detached)**
- Runs in background
- Great for "set it and forget it" development
- Frees up your terminal

**4. 📚 Docker with Testing**
- Includes automated test runners
- Continuous testing while you code
- Perfect for TDD workflows

**5. ⚙️ Custom Configuration**
- Advanced options for power users
- Custom ports
- Debug mode with inspector
- Production build testing
- Database-only mode

## 🏃‍♂️ Super Quick Start (3 Steps)

1. **Clone and Install**
   ```bash
   git clone <your-repo-url> manito-debug
   cd manito-debug
   npm install
   ```

2. **Launch Interactive CLI**
   ```bash
   npm run dev
   ```

3. **Choose Your Adventure**
   - For beginners: Choose `1` (Local Development)
   - For full experience: Choose `2` (Docker Development)
   - Press `q` to exit anytime

## 🎨 What You'll See

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ✨ ManitoDebug Development Environment Launcher ✨       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

⚙️ System Status Check...

Prerequisites:
  ✅ Node.js 20+ (Ready)
  ✅ Docker (Ready)  
  ✅ Docker Compose (Ready)
  ✅ Git (Ready)

Port Usage:
  ✅ Port 3000 (Available)
  ✅ Port 5173 (Available)
  ✅ Port 5432 (Available)
  ✅ Port 6379 (Available)

🚀 Choose Development Mode:

  1. 💻 Local Development (Recommended)
     Run directly on your machine
     Requires: Node.js 20+

  2. 🐳 Docker Development (Recommended)
     Full containerized environment with all services
     Requires: Docker, Docker Compose

Choose deployment mode (1-5, q to quit): 
```

## 🛠️ Advanced Usage

### Custom Ports
If ports 3000 or 5173 are in use, choose option `5` → `1` for custom port configuration.

### Debug Mode
For debugging with VS Code:
1. Choose option `5` → `3`
2. Debugger will be available on port 9229
3. Use "Attach to Docker Node.js" launch configuration

### Direct Commands (Bypass Interactive CLI)
```bash
npm run dev:direct          # Skip CLI, run local directly
npm run docker:dev          # Skip CLI, run Docker directly
./scripts/dev-docker.sh up  # Direct Docker script
```

## 🚨 Troubleshooting

### Port Conflicts
The CLI automatically detects port conflicts and shows warnings. Choose custom ports or stop conflicting services.

### Docker Issues
If Docker isn't running, the CLI will show appropriate warnings and recommend Local Development mode.

### Permission Issues
Make sure the interactive script is executable:
```bash
chmod +x scripts/interactive-dev.js
```

## 🎯 Tips for Best Experience

- **First time?** → Choose Local Development (`1`)
- **Team development?** → Choose Docker Development (`2`)
- **Running tests?** → Choose Docker with Testing (`4`)
- **Background development?** → Choose Docker Detached (`3`)
- **Debugging issues?** → Choose Custom Configuration (`5`)

## 📚 Next Steps

After your development environment starts:

1. **Frontend**: Open `http://localhost:5173`
2. **Backend API**: Visit `http://localhost:3000`
3. **Health Check**: Check `http://localhost:3000/api/health`
4. **Documentation**: Read `DEVELOPMENT.md` for detailed info

## 🎉 That's It!

The interactive CLI handles all the complexity for you. Just run `npm run dev` and choose your preferred development style!

Happy coding! ✨