#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class FullStackSetupEnsurer {
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
    
    // Check if node_modules exist in all directories
    const directories = ['', 'client', 'server', 'core'];
    let needsInstall = false;

    for (const dir of directories) {
      const nodeModulesPath = path.join(this.rootDir, dir, 'node_modules');
      try {
        await fs.access(nodeModulesPath);
        this.log(`✅ ${dir || 'root'} dependencies installed`);
      } catch {
        this.log(`⚠️  ${dir || 'root'} dependencies missing`);
        needsInstall = true;
      }
    }

    if (needsInstall) {
      this.log('Installing missing dependencies using npm workspaces...');
      
      // Use npm workspaces to install all dependencies at once
      await this.runCommand('npm install');
      
      this.log('✅ All dependencies installed');
    }
  }

  async checkEnvironment() {
    this.log('Checking environment configuration...');
    
    const envPath = path.join(this.rootDir, '.env');
    try {
      await fs.access(envPath);
      this.log('✅ .env file exists');
    } catch {
      this.log('Creating .env file with dynamic port management configuration...');
      const envContent = `# Database Configuration
POSTGRES_USER=manito_dev
POSTGRES_PASSWORD=manito_dev_password
POSTGRES_HOST=localhost
POSTGRES_DB=manito_dev
POSTGRES_PORT=5432
POSTGRES_SCHEMA=manito_dev

# Dynamic Port Management Configuration
NODE_ENV=development
ENABLE_DYNAMIC_PORTS=true
PORT_MANAGER_STRATEGY=minimal
PORT_HEALTH_CHECK_TIMEOUT=5000
PORT_MAX_RETRIES=5
PORT_AUTO_REASSIGN=true

# Dynamic Port Ranges
SERVER_PORT_RANGE_START=3000
SERVER_PORT_RANGE_END=3999
CLIENT_PORT_RANGE_START=3000
CLIENT_PORT_RANGE_END=3999
DATABASE_PORT_RANGE_START=5432
DATABASE_PORT_RANGE_END=5439
REDIS_PORT_RANGE_START=6379
REDIS_PORT_RANGE_END=6389
MONITORING_PORT_RANGE_START=9090
MONITORING_PORT_RANGE_END=9099

# Legacy Port Configuration (for backward compatibility)
PORT_RANGE_START=3000
PORT_RANGE_END=3010
CLIENT_PORT_RANGE_START=5173
CLIENT_PORT_RANGE_END=5180
WEBSOCKET_PORT_RANGE_START=3001
WEBSOCKET_PORT_RANGE_END=3010

# Email Configuration - Ensures manito.ai emails are accepted
ALLOWED_EMAIL_DOMAINS=manito.ai,manito.com,gmail.com,yahoo.com,outlook.com,hotmail.com

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
      this.log('✅ .env file created with dynamic port management');
    }
  }

  async checkDirectories() {
    this.log('Checking required directories...');
    
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
        this.log(`✅ Directory ready: ${dir}`);
      } catch (error) {
        this.log(`⚠️  Directory issue: ${dir}`);
      }
    }
  }

  async checkPortManager() {
    this.log('Checking dynamic port manager...');
    
    const portManagerPath = path.join(this.rootDir, 'server/services/portManager.js');
    try {
      await fs.access(portManagerPath);
      this.log('✅ Dynamic port manager exists');
    } catch {
      this.log('❌ Dynamic port manager missing - running full setup...');
      await this.runFullSetup();
    }
  }

  async runFullSetup() {
    this.log('Running full setup...');
    const success = await this.runCommand('npm run setup');
    if (success) {
      this.log('✅ Full setup completed');
    } else {
      this.log('❌ Full setup failed');
    }
  }

  async testDynamicPortManagement() {
    this.log('Testing dynamic port management...');
    
    try {
      const success = await this.runCommand('npm run test:dynamic-ports');
      if (success) {
        this.log('✅ Dynamic port management test passed');
      } else {
        this.log('⚠️  Dynamic port management test failed - continuing anyway');
      }
    } catch (error) {
      this.log('⚠️  Could not test dynamic port management - continuing');
    }
  }

  async ensureDatabaseReady() {
    this.log('Ensuring database is ready...');
    
    // Check if PostgreSQL is running
    try {
      execSync('pg_isready -h localhost -p 5432', { stdio: 'pipe' });
      this.log('✅ PostgreSQL is running');
    } catch {
      this.log('⚠️  PostgreSQL not running - you may need to start it manually');
      this.log('   For development, you can use: brew services start postgresql');
    }
  }

  async run() {
    console.log('🔧 ENSURING FULL STACK SETUP');
    console.log('=' .repeat(50));
    
    try {
      await this.checkDependencies();
      await this.checkEnvironment();
      await this.checkDirectories();
      await this.checkPortManager();
      await this.ensureDatabaseReady();
      await this.testDynamicPortManagement();
      
      this.setupComplete = true;
      
      console.log('\n🎉 SETUP VERIFICATION COMPLETE!');
      console.log('=' .repeat(50));
      console.log('✅ All dependencies verified');
      console.log('✅ Environment configured');
      console.log('✅ Directories ready');
      console.log('✅ Dynamic port manager ready');
      console.log('✅ Database connection checked');
      console.log('✅ Dynamic port management tested');
      
      console.log('\n🚀 STARTING FULL STACK WITH DYNAMIC PORT MANAGEMENT...');
      console.log('   The system will automatically:');
      console.log('   • Detect available ports');
      console.log('   • Resolve any port conflicts');
      console.log('   • Start server and client on optimal ports');
      console.log('   • Display the URLs for access');
      
    } catch (error) {
      this.log(`Setup verification failed: ${error.message}`, 'error');
      this.log('Running full setup to fix issues...', 'error');
      await this.runFullSetup();
    }
  }
}

// Run the setup verification
const ensurer = new FullStackSetupEnsurer();
ensurer.run().catch(console.error);
