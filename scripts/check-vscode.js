#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Skip VS Code checks in production environments or CI
if (process.env.NODE_ENV === 'production' || 
    process.env.CI || 
    process.env.SKIP_VSCODE_CHECK === 'true') {
  console.log('Skipping VS Code extension check in production/CI mode');
  process.exit(0);
}

console.log('🔍 ManitoDebug Setup Check\n');

async function checkVSCode() {
  return new Promise((resolve) => {
    exec('code --version', (error, stdout) => {
      if (error) {
        console.log('ℹ️  VS Code CLI not detected in PATH');
        console.log('💡 To enable VS Code integration:');
        console.log('   1. Open VS Code');
        console.log('   2. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)');
        console.log('   3. Type: "Shell Command: Install \'code\' command in PATH"');
        console.log('   4. Select and run the command\n');
        resolve(false);
      } else {
        const version = stdout.trim().split('\n')[0];
        console.log('✅ VS Code CLI detected:', version);
        resolve(true);
      }
    });
  });
}

function checkWorkspaceFiles() {
  const workspaceFile = path.join(__dirname, '..', 'ManitoDebug.code-workspace');
  const vscodeDir = path.join(__dirname, '..', '.vscode');
  
  if (fs.existsSync(workspaceFile)) {
    console.log('✅ VS Code workspace file found');
  }
  
  if (fs.existsSync(vscodeDir)) {
    console.log('✅ VS Code settings directory found');
  }
  
  console.log('\n📝 To get the best experience:');
  console.log('   • Open: ManitoDebug.code-workspace in VS Code');
  console.log('   • Or:   File → Open Workspace from File → Select ManitoDebug.code-workspace');
}

function showExtensionInfo() {
  console.log('\n🔧 VS Code Extension:');
  console.log('   • Install manually: npm run install-extension');
  console.log('   • Or: The extension will auto-prompt when you open the workspace');
  console.log('   • Extension provides: Real-time scanning, dependency graphs, AI analysis\n');
}

async function main() {
  const hasVSCode = await checkVSCode();
  checkWorkspaceFiles();
  
  if (hasVSCode) {
    showExtensionInfo();
  }
  
  console.log('🚀 Setup complete! Run "npm run dev" to start the development servers.');
  console.log('📖 See README.md for detailed usage instructions.');
}

// Only run if called directly (not when required)
if (require.main === module) {
  main().catch(console.error);
}