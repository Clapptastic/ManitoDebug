#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 ManitoDebug Extension Installer\n');

async function checkVSCodeInstalled() {
  return new Promise((resolve) => {
    exec('code --version', (error) => {
      resolve(!error);
    });
  });
}

async function installExtension() {
  const extensionPath = path.join(__dirname, '..', 'vscode-extension');
  
  if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension directory not found:', extensionPath);
    process.exit(1);
  }

  console.log('📦 Installing ManitoDebug VS Code Extension...');
  console.log('Extension path:', extensionPath);
  
  return new Promise((resolve, reject) => {
    const installProcess = spawn('code', ['--install-extension', extensionPath], {
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    installProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    installProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ ManitoDebug extension installed successfully!');
        console.log('\n🚀 You can now use the following commands in VS Code:');
        console.log('   • Cmd+Shift+P → "Manito: Scan Workspace"');
        console.log('   • Cmd+Shift+P → "Manito: Show Dependency Graph"'); 
        console.log('   • Cmd+Shift+P → "Manito: Open Dashboard"');
        console.log('\n💡 The extension will appear in your status bar as "$(graph) Manito"');
        resolve();
      } else {
        console.error('\n❌ Failed to install extension. Exit code:', code);
        if (errorOutput) {
          console.error('Error details:', errorOutput);
        }
        reject(new Error(`Installation failed with exit code ${code}`));
      }
    });

    installProcess.on('error', (error) => {
      console.error('\n❌ Error running VS Code command:', error.message);
      console.error('\n💡 Make sure VS Code is installed and the "code" command is available in your PATH.');
      console.error('   You can enable this by running "Shell Command: Install \'code\' command in PATH" from VS Code.');
      reject(error);
    });
  });
}

async function main() {
  try {
    const vscodeInstalled = await checkVSCodeInstalled();
    
    if (!vscodeInstalled) {
      console.error('❌ VS Code CLI not found. Please ensure VS Code is installed and the "code" command is available.');
      console.error('💡 In VS Code, use: Command Palette → "Shell Command: Install \'code\' command in PATH"');
      process.exit(1);
    }

    console.log('✅ VS Code CLI found');
    await installExtension();
    
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}