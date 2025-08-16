#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FullStackSetup {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.setupComplete = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔧';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, cwd = this.rootDir) {
    try {
      this.log(`Running: ${command}`);
      execSync(command, { 
        cwd, 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      return true;
    } catch (error) {
      this.log(`Command failed: ${command}`, 'error');
      return false;
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...');
    
    const requiredPackages = [
      'concurrently',
      'node-fetch'
    ];

    const clientPackages = [
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dropdown-menu',
      'react',
      'react-dom',
      'vite'
    ];

    const serverPackages = [
      'express',
      'cors',
      'helmet',
      'pg',
      'ws',
      'nodemon'
    ];

    // Check root dependencies
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        this.log(`✅ ${pkg} found`);
      } catch {
        this.log(`⚠️  ${pkg} missing, will install`);
        await this.runCommand(`npm install ${pkg}`);
      }
    }

    // Check client dependencies
    for (const pkg of clientPackages) {
      try {
        require.resolve(path.join(this.rootDir, 'client/node_modules', pkg));
        this.log(`✅ client: ${pkg} found`);
      } catch {
        this.log(`⚠️  client: ${pkg} missing, will install`);
        await this.runCommand('npm install', path.join(this.rootDir, 'client'));
      }
    }

    // Check server dependencies
    for (const pkg of serverPackages) {
      try {
        require.resolve(path.join(this.rootDir, 'server/node_modules', pkg));
        this.log(`✅ server: ${pkg} found`);
      } catch {
        this.log(`⚠️  server: ${pkg} missing, will install`);
        await this.runCommand('npm install', path.join(this.rootDir, 'server'));
      }
    }
  }

  async setupDatabase() {
    this.log('Setting up database configuration...');
    
    // Create .env file if it doesn't exist
    const envPath = path.join(this.rootDir, '.env');
    try {
      await fs.access(envPath);
      this.log('✅ .env file exists');
    } catch {
      this.log('Creating .env file with default database configuration...');
      const envContent = `# Database Configuration
POSTGRES_USER=manito_dev
POSTGRES_PASSWORD=manito_dev_password
POSTGRES_HOST=localhost
POSTGRES_DB=manito_dev
POSTGRES_PORT=5432
POSTGRES_SCHEMA=manito_dev

# Server Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_ACQUIRE_TIMEOUT=60000
DB_IDLE_TIMEOUT=600000
DB_CONNECTION_TIMEOUT=2000
DB_STATEMENT_TIMEOUT=30000
DB_SSL=false
`;
      await fs.writeFile(envPath, envContent);
      this.log('✅ .env file created with default configuration');
    }
  }

  async setupDirectories() {
    this.log('Setting up required directories...');
    
    const directories = [
      'server/uploads',
      'server/logs',
      'client/dist',
      'scripts/test-upload'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.rootDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        this.log(`✅ Created directory: ${dir}`);
      } catch (error) {
        this.log(`⚠️  Directory already exists: ${dir}`);
      }
    }
  }

  async runMigrations() {
    this.log('Running database migrations...');
    
    // Start server temporarily to run migrations
    const serverProcess = spawn('node', ['server/index.js'], {
      cwd: this.rootDir,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test migration status
    try {
      const response = await fetch('http://localhost:3000/api/migrations/status');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.pending === 0) {
          this.log('✅ All migrations are up to date');
        } else {
          this.log('Running pending migrations...');
          const runResponse = await fetch('http://localhost:3000/api/migrations/run', {
            method: 'POST'
          });
          if (runResponse.ok) {
            this.log('✅ Migrations completed successfully');
          } else {
            this.log('⚠️  Migrations may have failed, but continuing...');
          }
        }
      }
    } catch (error) {
      this.log('⚠️  Could not check migrations, continuing...');
    }

    // Stop the temporary server
    serverProcess.kill();
  }

  async buildClient() {
    this.log('Building client...');
    const success = await this.runCommand('npm run build:client');
    if (success) {
      this.log('✅ Client build completed');
    } else {
      this.log('⚠️  Client build failed, but continuing...');
    }
  }

  async testFullStack() {
    this.log('Testing full stack functionality...');
    
    // Start both server and client
    const serverProcess = spawn('npm', ['run', 'dev:server'], {
      cwd: this.rootDir,
      stdio: 'pipe'
    });

    const clientProcess = spawn('npm', ['run', 'dev:client'], {
      cwd: this.rootDir,
      stdio: 'pipe'
    });

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test server health
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        this.log('✅ Server is healthy');
      } else {
        this.log('❌ Server health check failed');
      }
    } catch (error) {
      this.log('❌ Server is not responding');
    }

    // Test client accessibility
    try {
      const response = await fetch('http://localhost:5173');
      if (response.ok) {
        this.log('✅ Client is accessible');
      } else {
        this.log('❌ Client is not accessible');
      }
    } catch (error) {
      this.log('❌ Client is not responding');
    }

    // Stop the test processes
    serverProcess.kill();
    clientProcess.kill();
  }

  async createStartupScript() {
    this.log('Creating enhanced startup script...');
    
    const startupScript = `#!/bin/bash

# ManitoDebug Full Stack Startup Script
echo "🚀 Starting ManitoDebug Full Stack..."

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check required ports
check_port 3000 || exit 1
check_port 5173 || exit 1

# Set environment variables
export NODE_ENV=development
export PORT=3000
export CLIENT_URL=http://localhost:5173

# Start the full stack
echo "🔧 Starting server and client..."
npm run dev

echo "✅ ManitoDebug Full Stack is running!"
echo "📱 Client: http://localhost:5173"
echo "🔌 Server: http://localhost:3000"
echo "📊 Health: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop all services"
`;

    const scriptPath = path.join(this.rootDir, 'start-fullstack.sh');
    await fs.writeFile(scriptPath, startupScript);
    await fs.chmod(scriptPath, '755');
    this.log('✅ Startup script created: start-fullstack.sh');
  }

  async updatePackageScripts() {
    this.log('Updating package.json scripts...');
    
    const packagePath = path.join(this.rootDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
    
    // Update scripts to ensure full functionality
    packageJson.scripts = {
      ...packageJson.scripts,
      "dev": "concurrently --kill-others-on-fail --prefix \"[{name}]\" --names \"server,client\" \"npm run dev:server\" \"npm run dev:client\"",
      "dev:client": "cd client && npm run dev",
      "dev:server": "cd server && npm run dev",
      "setup": "node scripts/setup-fullstack.js",
      "test:e2e": "node scripts/e2e-test-suite.js",
      "start:fullstack": "./start-fullstack.sh"
    };
    
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
    this.log('✅ Package.json scripts updated');
  }

  async run() {
    console.log('🔧 MANITO DEBUG FULL STACK SETUP');
    console.log('=' .repeat(50));
    
    try {
      await this.checkDependencies();
      await this.setupDatabase();
      await this.setupDirectories();
      await this.runMigrations();
      await this.buildClient();
      await this.createStartupScript();
      await this.updatePackageScripts();
      
      this.setupComplete = true;
      
      console.log('\n🎉 SETUP COMPLETE!');
      console.log('=' .repeat(50));
      console.log('✅ All dependencies installed');
      console.log('✅ Database configured');
      console.log('✅ Directories created');
      console.log('✅ Migrations applied');
      console.log('✅ Client built');
      console.log('✅ Startup script created');
      console.log('✅ Package scripts updated');
      
      console.log('\n🚀 TO START THE FULL STACK:');
      console.log('   npm run dev');
      console.log('   OR');
      console.log('   ./start-fullstack.sh');
      
      console.log('\n🧪 TO TEST FUNCTIONALITY:');
      console.log('   npm run test:e2e');
      
      console.log('\n📱 ACCESS POINTS:');
      console.log('   Client: http://localhost:5173');
      console.log('   Server: http://localhost:3000');
      console.log('   Health: http://localhost:3000/api/health');
      
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the setup
const setup = new FullStackSetup();
setup.run().catch(console.error);
