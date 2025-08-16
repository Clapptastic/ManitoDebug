#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ManitoCLI {
  constructor() {
    this.program = new Command();
    this.serverPort = null;
    this.setupCommands();
  }

  async detectServerPort() {
    const commonPorts = [3000, 3001, 3002, 3003, 3004, 3005, 8080];
    
    for (const port of commonPorts) {
      try {
        const response = await fetch(`http://localhost:${port}/api/health`);
        if (response.ok) {
          this.serverPort = port;
          console.log(`✅ Server detected on port ${port}`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('❌ Could not detect server port');
    return false;
  }

  setupCommands() {
    this.program
      .name('manito')
      .description('ManitoDebug CLI - Code analysis and debugging tool')
      .version('1.0.0');

    this.program
      .command('scan')
      .description('Scan a directory for code analysis')
      .argument('<path>', 'Directory path to scan')
      .option('-p, --port <port>', 'Server port (auto-detected if not specified)')
      .option('-o, --output <file>', 'Output file for results')
      .action(async (scanPath, options) => {
        await this.handleScan(scanPath, options);
      });

    this.program
      .command('analyze')
      .description('Analyze scan results with AI')
      .argument('<scanId>', 'Scan ID to analyze')
      .option('-p, --port <port>', 'Server port (auto-detected if not specified)')
      .action(async (scanId, options) => {
        await this.handleAnalyze(scanId, options);
      });

    this.program
      .command('status')
      .description('Check server status')
      .option('-p, --port <port>', 'Server port (auto-detected if not specified)')
      .action(async (options) => {
        await this.handleStatus(options);
      });
  }

  async handleScan(scanPath, options) {
    try {
      if (!this.serverPort && !options.port) {
        const detected = await this.detectServerPort();
        if (!detected) {
          console.log('❌ Please specify a port or ensure the server is running');
          return;
        }
      }

      const port = options.port || this.serverPort;
      console.log(`🔍 Scanning: ${scanPath}`);
      console.log(`🌐 Server: http://localhost:${port}`);

      const response = await fetch(`http://localhost:${port}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: scanPath,
          options: {
            patterns: ['**/*.{js,jsx,ts,tsx}'],
            excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Scan completed successfully');
        console.log(`📊 Files scanned: ${result.data.files?.length || 0}`);
        console.log(`🔗 Dependencies found: ${result.data.dependencies?.length || 0}`);
        console.log(`⚠️  Conflicts detected: ${result.data.conflicts?.length || 0}`);
        
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify(result.data, null, 2));
          console.log(`💾 Results saved to: ${options.output}`);
        }
      } else {
        console.log('❌ Scan failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async handleAnalyze(scanId, options) {
    try {
      if (!this.serverPort && !options.port) {
        const detected = await this.detectServerPort();
        if (!detected) {
          console.log('❌ Please specify a port or ensure the server is running');
          return;
        }
      }

      const port = options.port || this.serverPort;
      console.log(`🤖 Analyzing scan: ${scanId}`);
      console.log(`🌐 Server: http://localhost:${port}`);

      const response = await fetch(`http://localhost:${port}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Analysis completed successfully');
        console.log(`📊 Project type: ${result.data.metadata?.projectType || 'Unknown'}`);
        console.log(`⚙️  Framework: ${result.data.metadata?.framework || 'None'}`);
        console.log(`💡 Recommendations: ${Object.keys(result.data.recommendations || {}).length}`);
      } else {
        console.log('❌ Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async handleStatus(options) {
    try {
      if (!this.serverPort && !options.port) {
        const detected = await this.detectServerPort();
        if (!detected) {
          console.log('❌ Please specify a port or ensure the server is running');
          return;
        }
      }

      const port = options.port || this.serverPort;
      console.log(`🌐 Checking server status: http://localhost:${port}`);

      const response = await fetch(`http://localhost:${port}/api/health`);
      
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Server is healthy');
        console.log(`📊 Status: ${health.status}`);
        console.log(`⏱️  Uptime: ${health.uptime}s`);
        console.log(`🌍 Environment: ${health.environment}`);
      } else {
        console.log('❌ Server is not responding');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async run() {
    await this.program.parseAsync();
  }
}

const cli = new ManitoCLI();
cli.run().catch(console.error);