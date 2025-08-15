const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

class ManitoExtensionInstaller {
  constructor() {
    this.hasPrompted = false;
  }

  async checkIfManitoExtensionInstalled() {
    const extensions = vscode.extensions.all;
    return extensions.some(ext => 
      ext.id.includes('manito') || 
      ext.packageJSON?.name === 'manito-vscode' ||
      ext.packageJSON?.displayName?.includes('Manito')
    );
  }

  async promptForInstallation() {
    if (this.hasPrompted) return;
    this.hasPrompted = true;

    const isInstalled = await this.checkIfManitoExtensionInstalled();
    if (isInstalled) {
      console.log('ManitoDebug extension is already installed');
      return;
    }

    const selection = await vscode.window.showInformationMessage(
      '🔍 Would you like to install the ManitoDebug VS Code extension for enhanced code analysis features?',
      {
        modal: false,
        detail: 'The ManitoDebug extension provides:\n• Real-time code scanning\n• Dependency graph visualization\n• AI-powered analysis\n• Direct integration with the platform'
      },
      'Install Extension',
      'Not Now',
      'Don\'t Ask Again'
    );

    switch (selection) {
      case 'Install Extension':
        await this.installExtension();
        break;
      case 'Don\'t Ask Again':
        await this.disablePrompts();
        break;
      default:
        console.log('User chose not to install the extension');
    }
  }

  async installExtension() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const extensionPath = path.join(workspaceFolder.uri.fsPath, 'vscode-extension');

    try {
      vscode.window.showInformationMessage('Installing ManitoDebug extension...');
      
      // First, package the extension
      await this.packageExtension(extensionPath);
      
      // Then install it
      await this.installPackagedExtension(extensionPath);
      
      vscode.window.showInformationMessage(
        '✅ ManitoDebug extension installed successfully! Reload VS Code to activate.',
        'Reload Now'
      ).then(selection => {
        if (selection === 'Reload Now') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });

    } catch (error) {
      console.error('Extension installation failed:', error);
      vscode.window.showErrorMessage(`Failed to install ManitoDebug extension: ${error.message}`);
      
      // Offer manual installation instructions
      const choice = await vscode.window.showErrorMessage(
        'Automatic installation failed. Would you like to see manual installation instructions?',
        'Show Instructions'
      );
      
      if (choice === 'Show Instructions') {
        this.showManualInstructions();
      }
    }
  }

  async packageExtension(extensionPath) {
    return new Promise((resolve, reject) => {
      const vsce = spawn('npx', ['vsce', 'package'], {
        cwd: extensionPath,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      vsce.stdout.on('data', (data) => {
        output += data.toString();
      });

      vsce.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      vsce.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`VSCE packaging failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      vsce.on('error', (error) => {
        reject(new Error(`Failed to run vsce: ${error.message}`));
      });
    });
  }

  async installPackagedExtension(extensionPath) {
    return new Promise((resolve, reject) => {
      // Find the .vsix file
      const vsixFile = path.join(extensionPath, 'manito-vscode-1.0.0.vsix');
      
      const installProcess = spawn('code', ['--install-extension', vsixFile], {
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      installProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      installProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Extension installation failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      installProcess.on('error', (error) => {
        reject(new Error(`Failed to run code command: ${error.message}`));
      });
    });
  }

  showManualInstructions() {
    const instructions = `
## Manual Installation Instructions

1. **Package the extension:**
   \`\`\`bash
   cd vscode-extension
   npx vsce package
   \`\`\`

2. **Install the packaged extension:**
   \`\`\`bash
   code --install-extension manito-vscode-1.0.0.vsix
   \`\`\`

3. **Or install from source:**
   - Open VS Code
   - Press F5 to open Extension Development Host
   - The extension will be automatically loaded

4. **Alternative: Use the installer script:**
   \`\`\`bash
   npm run install-extension
   \`\`\`
`;

    vscode.workspace.openTextDocument({
      content: instructions,
      language: 'markdown'
    }).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  async disablePrompts() {
    const config = vscode.workspace.getConfiguration('manito');
    await config.update('autoPromptExtension', false, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage('Extension installation prompts disabled for this workspace');
  }
}

module.exports = { ManitoExtensionInstaller };