#!/usr/bin/env node

const { spawn, exec } = require('child_process')
const readline = require('readline')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

// Unicode symbols
const symbols = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  docker: '🐳',
  computer: '💻',
  gear: '⚙️',
  sparkles: '✨',
  books: '📚'
}

class InteractiveDev {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    this.projectRoot = path.resolve(__dirname, '..')
  }

  // Helper methods
  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`)
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve)
    })
  }

  async checkPrerequisites() {
    const checks = {
      node: false,
      nodeVersion: '',
      docker: false,
      dockerCompose: false,
      git: false
    }

    return new Promise((resolve) => {
      // Check Node.js
      exec('node --version', (error, stdout) => {
        if (!error) {
          checks.nodeVersion = stdout.trim()
          const majorVersion = parseInt(checks.nodeVersion.replace('v', '').split('.')[0])
          checks.node = majorVersion >= 20
        }

        // Check Docker
        exec('docker --version', (error2) => {
          if (!error2) {
            exec('docker info', (infoError) => {
              // Check if Docker daemon is actually running
              checks.docker = !infoError
            })
          }

          // Check Docker Compose
          exec('docker-compose --version', (error3) => {
            if (error3) {
              exec('docker compose version', (error4) => {
                checks.dockerCompose = !error4
              })
            } else {
              checks.dockerCompose = true
            }

            // Check Git
            exec('git --version', (error5) => {
              checks.git = !error5
              resolve(checks)
            })
          })
        })
      })
    })
  }

  async detectRunningServices() {
    const services = {
      port3000: false,
      port5173: false,
      port5432: false,
      port6379: false,
      dockerContainers: []
    }

    return new Promise((resolve) => {
      // Check ports
      const checkPort = (port) => {
        return new Promise((portResolve) => {
          const net = require('net')
          const server = net.createServer()
          
          server.listen(port, () => {
            server.once('close', () => portResolve(false))
            server.close()
          })
          
          server.on('error', () => portResolve(true))
        })
      }

      Promise.all([
        checkPort(3000),
        checkPort(5173),
        checkPort(5432),
        checkPort(6379)
      ]).then(([port3000, port5173, port5432, port6379]) => {
        services.port3000 = port3000
        services.port5173 = port5173
        services.port5432 = port5432
        services.port6379 = port6379

        // Check Docker containers
        exec('docker ps --format "{{.Names}}" | grep manito', (error, stdout) => {
          if (!error && stdout) {
            services.dockerContainers = stdout.trim().split('\n')
          }
          resolve(services)
        })
      })
    })
  }

  displayHeader() {
    console.clear()
    this.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ${symbols.sparkles} ManitoDebug Development Environment Launcher ${symbols.sparkles}    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`)
  }

  async displaySystemStatus() {
    this.log(`${colors.bright}${symbols.gear} System Status Check...${colors.reset}\n`)
    
    const prerequisites = await this.checkPrerequisites()
    const services = await this.detectRunningServices()

    // Prerequisites
    this.log(`${colors.bright}Prerequisites:${colors.reset}`)
    this.log(`  ${prerequisites.node ? symbols.success : symbols.error} Node.js 20+ ${prerequisites.node ? colors.green : colors.red}${prerequisites.node ? '(Ready)' : '(Required)'}${colors.reset}`)
    this.log(`  ${prerequisites.docker ? symbols.success : symbols.warning} Docker ${prerequisites.docker ? colors.green : colors.yellow}${prerequisites.docker ? '(Ready)' : '(Optional for Docker mode)'}${colors.reset}`)
    this.log(`  ${prerequisites.dockerCompose ? symbols.success : symbols.warning} Docker Compose ${prerequisites.dockerCompose ? colors.green : colors.yellow}${prerequisites.dockerCompose ? '(Ready)' : '(Optional for Docker mode)'}${colors.reset}`)
    this.log(`  ${prerequisites.git ? symbols.success : symbols.warning} Git ${prerequisites.git ? colors.green : colors.yellow}${prerequisites.git ? '(Ready)' : '(Recommended)'}${colors.reset}`)

    // Running services
    this.log(`\n${colors.bright}Port Usage:${colors.reset}`)
    this.log(`  ${services.port3000 ? symbols.warning : symbols.success} Port 3000 ${services.port3000 ? colors.yellow + '(In Use)' : colors.green + '(Available)'}${colors.reset}`)
    this.log(`  ${services.port5173 ? symbols.warning : symbols.success} Port 5173 ${services.port5173 ? colors.yellow + '(In Use)' : colors.green + '(Available)'}${colors.reset}`)
    this.log(`  ${services.port5432 ? symbols.warning : symbols.success} Port 5432 ${services.port5432 ? colors.yellow + '(In Use)' : colors.green + '(Available)'}${colors.reset}`)
    this.log(`  ${services.port6379 ? symbols.warning : symbols.success} Port 6379 ${services.port6379 ? colors.yellow + '(In Use)' : colors.green + '(Available)'}${colors.reset}`)

    if (services.dockerContainers.length > 0) {
      this.log(`\n${colors.bright}Running Docker Containers:${colors.reset}`)
      services.dockerContainers.forEach(container => {
        this.log(`  ${symbols.docker} ${colors.cyan}${container}${colors.reset}`)
      })
    }

    return { prerequisites, services }
  }

  displayDeploymentOptions(status) {
    this.log(`\n${colors.bright}${symbols.rocket} Choose Development Mode:${colors.reset}\n`)

    const options = [
      {
        key: '1',
        title: 'Local Development',
        description: 'Run directly on your machine',
        icon: symbols.computer,
        color: 'green',
        requirements: ['Node.js 20+'],
        recommended: status.prerequisites.node && !status.services.port3000 && !status.services.port5173
      },
      {
        key: '2', 
        title: 'Docker Development (Recommended)',
        description: 'Full containerized environment with all services',
        icon: symbols.docker,
        color: 'blue',
        requirements: ['Docker', 'Docker Compose'],
        recommended: status.prerequisites.docker && status.prerequisites.dockerCompose
      },
      {
        key: '3',
        title: 'Docker (Detached)',
        description: 'Run Docker containers in background',
        icon: symbols.docker,
        color: 'cyan',
        requirements: ['Docker', 'Docker Compose'],
        recommended: false
      },
      {
        key: '4',
        title: 'Docker with Testing',
        description: 'Include automated testing containers',
        icon: symbols.books,
        color: 'magenta',
        requirements: ['Docker', 'Docker Compose'],
        recommended: false
      },
      {
        key: '5',
        title: 'Custom Configuration',
        description: 'Advanced options and configurations',
        icon: symbols.gear,
        color: 'yellow',
        requirements: [],
        recommended: false
      }
    ]

    options.forEach(option => {
      const recommended = option.recommended ? ` ${colors.green}(Recommended)${colors.reset}` : ''
      const requirements = option.requirements.length > 0 ? 
        `\n    ${colors.bright}Requires:${colors.reset} ${option.requirements.join(', ')}` : ''
      
      this.log(`  ${colors[option.color]}${option.key}${colors.reset}. ${colors.bright}${option.icon} ${option.title}${colors.reset}${recommended}`)
      this.log(`    ${colors.white}${option.description}${colors.reset}${requirements}\n`)
    })

    this.log(`  ${colors.red}q${colors.reset}. ${colors.bright}${symbols.error} Exit${colors.reset}\n`)
  }

  async executeDeployment(choice, status) {
    switch (choice) {
      case '1':
        await this.runLocalDevelopment()
        break
      case '2':
        await this.runDockerDevelopment()
        break
      case '3':
        await this.runDockerDetached()
        break
      case '4':
        await this.runDockerWithTesting()
        break
      case '5':
        await this.runCustomConfiguration()
        break
      case 'q':
        this.log(`\n${symbols.info} Goodbye! Happy coding! ${symbols.sparkles}`)
        process.exit(0)
        break
      default:
        this.log(`\n${colors.red}${symbols.error} Invalid choice. Please try again.${colors.reset}\n`)
        return false
    }
    return true
  }

  async runLocalDevelopment() {
    this.log(`\n${colors.green}${symbols.rocket} Starting Local Development...${colors.reset}\n`)
    
    this.log(`${colors.bright}This will start:${colors.reset}`)
    this.log(`  • Server on http://localhost:3000`)
    this.log(`  • Client on http://localhost:5173`)
    this.log(`  • File watching and hot reloading`)
    this.log(`\n${colors.bright}🚀 Quick Access:${colors.reset}`)
    this.log(`  • ${colors.cyan}🌐 Open UI:${colors.reset} http://localhost:5173`)
    this.log(`  • ${colors.cyan}🔗 API Health:${colors.reset} http://localhost:3000/api/health`)
    this.log(`\n${colors.bright}📋 Development Info:${colors.reset}`)
    this.log(`  • Hot reloading enabled for both client and server`)
    this.log(`  • Press Ctrl+C to stop all services`)
    this.log(`  • Check terminal for build status and errors\n`)

    // Change to project directory and run direct dev command
    process.chdir(this.projectRoot)
    
    const devProcess = spawn('npm', ['run', 'dev:direct'], {
      stdio: 'inherit',
      shell: true
    })

    devProcess.on('close', (code) => {
      this.log(`\n${colors.yellow}${symbols.warning} Development servers stopped (exit code: ${code})${colors.reset}`)
      this.cleanup()
    })

    // Handle process termination
    process.on('SIGINT', () => {
      this.log(`\n${colors.yellow}${symbols.warning} Stopping development servers...${colors.reset}`)
      devProcess.kill('SIGTERM')
    })
  }

  async runDockerDevelopment() {
    this.log(`\n${colors.blue}${symbols.docker} Starting Docker Development Environment...${colors.reset}\n`)
    
    this.log(`${colors.bright}This will start:${colors.reset}`)
    this.log(`  • Full containerized environment`)
    this.log(`  • PostgreSQL database with sample data`)
    this.log(`  • Redis cache`)
    this.log(`  • Hot reloading for all services`)
    this.log(`  • Client: http://localhost:5173`)
    this.log(`  • Server: http://localhost:3000`)
    this.log(`  • Database: localhost:5432`)
    this.log(`\n${colors.bright}🚀 Quick Access:${colors.reset}`)
    this.log(`  • ${colors.cyan}🌐 Open UI:${colors.reset} http://localhost:5173`)
    this.log(`  • ${colors.cyan}🔗 API Health:${colors.reset} http://localhost:3000/api/health`)
    this.log(`  • ${colors.cyan}🛢️ Database:${colors.reset} localhost:5432 (manito_dev/manito_dev_password)`)
    this.log(`  • ${colors.cyan}🔴 Redis:${colors.reset} localhost:6379`)
    this.log(`\n${colors.bright}📋 Development Info:${colors.reset}`)
    this.log(`  • All services with hot reloading`)
    this.log(`  • Press Ctrl+C to stop all services`)
    this.log(`  • Check terminal for container status and logs\n`)

    const dockerProcess = spawn('./scripts/dev-docker.sh', ['up'], {
      stdio: 'inherit',
      shell: true,
      cwd: this.projectRoot
    })

    dockerProcess.on('close', (code) => {
      this.log(`\n${colors.yellow}${symbols.warning} Docker services stopped (exit code: ${code})${colors.reset}`)
      this.cleanup()
    })

    process.on('SIGINT', () => {
      this.log(`\n${colors.yellow}${symbols.warning} Stopping Docker services...${colors.reset}`)
      dockerProcess.kill('SIGTERM')
    })
  }

  async runDockerDetached() {
    this.log(`\n${colors.cyan}${symbols.docker} Starting Docker Development (Detached)...${colors.reset}\n`)
    
    const dockerProcess = spawn('./scripts/dev-docker.sh', ['up', '--detach'], {
      stdio: 'inherit',
      shell: true,
      cwd: this.projectRoot
    })

    dockerProcess.on('close', (code) => {
      if (code === 0) {
        this.log(`\n${colors.green}${symbols.success} Docker services started in background!${colors.reset}`)
        this.log(`\n${colors.bright}🚀 Quick Access:${colors.reset}`)
        this.log(`  • ${colors.cyan}🌐 Open UI:${colors.reset} http://localhost:5173`)
        this.log(`  • ${colors.cyan}🔗 API Health:${colors.reset} http://localhost:3000/api/health`)
        this.log(`  • ${colors.cyan}🛢️ Database:${colors.reset} localhost:5432 (manito_dev/manito_dev_password)`)
        this.log(`  • ${colors.cyan}🔴 Redis:${colors.reset} localhost:6379`)
        this.log(`\n${colors.bright}📋 Management Commands:${colors.reset}`)
        this.log(`  • View logs: ${colors.yellow}./scripts/dev-docker.sh logs${colors.reset}`)
        this.log(`  • Stop services: ${colors.yellow}./scripts/dev-docker.sh down${colors.reset}`)
        this.log(`  • Check status: ${colors.yellow}./scripts/dev-docker.sh status${colors.reset}`)
        this.log(`  • Open shell: ${colors.yellow}./scripts/dev-docker.sh shell${colors.reset}`)
      } else {
        this.log(`\n${colors.red}${symbols.error} Failed to start Docker services (exit code: ${code})${colors.reset}`)
      }
      this.cleanup()
    })
  }

  async runDockerWithTesting() {
    this.log(`\n${colors.magenta}${symbols.books} Starting Docker Development with Testing...${colors.reset}\n`)
    
    this.log(`${colors.bright}This will start:${colors.reset}`)
    this.log(`  • Full containerized environment`)
    this.log(`  • PostgreSQL database with sample data`)
    this.log(`  • Redis cache`)
    this.log(`  • Automated test runner with file watching`)
    this.log(`  • Hot reloading for all services`)
    this.log(`\n${colors.bright}🚀 Quick Access:${colors.reset}`)
    this.log(`  • ${colors.cyan}🌐 Open UI:${colors.reset} http://localhost:5173`)
    this.log(`  • ${colors.cyan}🔗 API Health:${colors.reset} http://localhost:3000/api/health`)
    this.log(`  • ${colors.cyan}🛢️ Database:${colors.reset} localhost:5432 (manito_dev/manito_dev_password)`)
    this.log(`  • ${colors.cyan}🔴 Redis:${colors.reset} localhost:6379`)
    this.log(`\n${colors.bright}📋 Development Info:${colors.reset}`)
    this.log(`  • Tests will run automatically on file changes`)
    this.log(`  • All services with hot reloading`)
    this.log(`  • Press Ctrl+C to stop all services`)
    this.log(`  • Check terminal for test results and logs\n`)
    
    const dockerProcess = spawn('./scripts/dev-docker.sh', ['up', '--testing'], {
      stdio: 'inherit',
      shell: true,
      cwd: this.projectRoot
    })

    dockerProcess.on('close', (code) => {
      this.log(`\n${colors.yellow}${symbols.warning} Docker services with testing stopped (exit code: ${code})${colors.reset}`)
      this.cleanup()
    })

    process.on('SIGINT', () => {
      this.log(`\n${colors.yellow}${symbols.warning} Stopping Docker services...${colors.reset}`)
      dockerProcess.kill('SIGTERM')
    })
  }

  async runCustomConfiguration() {
    this.log(`\n${colors.yellow}${symbols.gear} Custom Configuration${colors.reset}\n`)
    
    this.log(`${colors.bright}Advanced Options:${colors.reset}`)
    this.log(`  1. Local with custom ports`)
    this.log(`  2. Docker with specific profiles`)
    this.log(`  3. Debug mode with inspector`)
    this.log(`  4. Production build testing`)
    this.log(`  5. Database only`)
    this.log(`  6. Back to main menu\n`)

    const customChoice = await this.question(`${colors.cyan}Choose option (1-6): ${colors.reset}`)
    
    switch (customChoice.trim()) {
      case '1':
        await this.runCustomPorts()
        break
      case '2':
        await this.runCustomDockerProfiles()
        break
      case '3':
        await this.runDebugMode()
        break
      case '4':
        await this.runProductionTest()
        break
      case '5':
        await this.runDatabaseOnly()
        break
      case '6':
        return // Return to main menu
      default:
        this.log(`\n${colors.red}${symbols.error} Invalid option.${colors.reset}`)
    }
  }

  async runCustomPorts() {
    const serverPort = await this.question(`${colors.cyan}Server port (default 3000): ${colors.reset}`) || '3000'
    const clientPort = await this.question(`${colors.cyan}Client port (default 5173): ${colors.reset}`) || '5173'
    
    this.log(`\n${colors.green}${symbols.rocket} Starting with custom ports...${colors.reset}`)
    this.log(`  • Server: http://localhost:${serverPort}`)
    this.log(`  • Client: http://localhost:${clientPort}`)
    this.log(`\n${colors.bright}🚀 Quick Access:${colors.reset}`)
    this.log(`  • ${colors.cyan}🌐 Open UI:${colors.reset} http://localhost:${clientPort}`)
    this.log(`  • ${colors.cyan}🔗 API Health:${colors.reset} http://localhost:${serverPort}/api/health`)
    this.log(`\n${colors.bright}📋 Development Info:${colors.reset}`)
    this.log(`  • Hot reloading enabled for both client and server`)
    this.log(`  • Press Ctrl+C to stop all services`)
    this.log(`  • Check terminal for build status and errors\n`)

    process.env.PORT = serverPort
    process.env.VITE_PORT = clientPort
    
    const devProcess = spawn('npm', ['run', 'dev:direct'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: serverPort, VITE_PORT: clientPort },
      cwd: this.projectRoot
    })

    this.handleProcessCleanup(devProcess)
  }

  async runCustomDockerProfiles() {
    this.log(`${colors.bright}Available profiles:${colors.reset}`)
    this.log(`  • tools - Development tools container`)
    this.log(`  • testing - Automated test runner`)
    this.log(`  • both - Tools and testing`)
    
    const profile = await this.question(`${colors.cyan}Profile (tools/testing/both): ${colors.reset}`)
    
    let args = ['up']
    if (profile === 'tools') args.push('--tools')
    if (profile === 'testing') args.push('--testing')
    if (profile === 'both') args.push('--tools', '--testing')

    const dockerProcess = spawn('./scripts/dev-docker.sh', args, {
      stdio: 'inherit',
      shell: true,
      cwd: this.projectRoot
    })

    this.handleProcessCleanup(dockerProcess)
  }

  async runDebugMode() {
    this.log(`\n${colors.green}${symbols.rocket} Starting Debug Mode...${colors.reset}`)
    this.log(`  • Debugger available on port 9229`)
    this.log(`  • VS Code can attach to the process`)
    this.log(`  • Use "Attach to Docker Node.js" launch config\n`)

    process.env.NODE_OPTIONS = '--inspect=0.0.0.0:9229'
    
    const devProcess = spawn('npm', ['run', 'dev:direct'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env },
      cwd: this.projectRoot
    })

    this.handleProcessCleanup(devProcess)
  }

  async runProductionTest() {
    this.log(`\n${colors.green}${symbols.rocket} Building for production testing...${colors.reset}\n`)
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: this.projectRoot
    })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        this.log(`\n${colors.green}${symbols.success} Build successful! Starting production server...${colors.reset}\n`)
        const startProcess = spawn('npm', ['start'], {
          stdio: 'inherit',
          shell: true,
          cwd: this.projectRoot
        })
        this.handleProcessCleanup(startProcess)
      } else {
        this.log(`\n${colors.red}${symbols.error} Build failed (exit code: ${code})${colors.reset}`)
        this.cleanup()
      }
    })
  }

  async runDatabaseOnly() {
    this.log(`\n${colors.blue}${symbols.docker} Starting Database Services Only...${colors.reset}\n`)
    
    const dockerProcess = spawn('docker-compose', ['-f', 'docker-compose.dev.yml', 'up', 'postgres-dev', 'redis-dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: this.projectRoot
    })

    this.handleProcessCleanup(dockerProcess)
  }

  handleProcessCleanup(childProcess) {
    childProcess.on('close', (code) => {
      this.log(`\n${colors.yellow}${symbols.warning} Process stopped (exit code: ${code})${colors.reset}`)
      this.cleanup()
    })

    process.on('SIGINT', () => {
      this.log(`\n${colors.yellow}${symbols.warning} Stopping process...${colors.reset}`)
      childProcess.kill('SIGTERM')
    })
  }

  cleanup() {
    this.rl.close()
  }

  async run() {
    try {
      this.displayHeader()
      const status = await this.displaySystemStatus()
      
      while (true) {
        this.displayDeploymentOptions(status)
        const choice = await this.question(`${colors.cyan}Choose deployment mode (1-5, q to quit): ${colors.reset}`)
        
        const success = await this.executeDeployment(choice.trim(), status)
        if (success) break
      }
    } catch (error) {
      this.log(`\n${colors.red}${symbols.error} Error: ${error.message}${colors.reset}`)
      this.cleanup()
      process.exit(1)
    }
  }
}

// Run the interactive development launcher
const launcher = new InteractiveDev()
launcher.run()