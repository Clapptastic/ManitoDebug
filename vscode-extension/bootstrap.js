const vscode = require('vscode');
const { ManitoExtensionInstaller } = require('./installer');

let installer;

function activate(context) {
  console.log('ManitoDebug Bootstrap Extension activated');
  
  installer = new ManitoExtensionInstaller();
  
  // Check if this is a ManitoDebug workspace
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const isManitoWorkspace = workspaceFolder && 
    (workspaceFolder.name.includes('Manito') || 
     workspaceFolder.uri.fsPath.includes('ManitoDebug') ||
     workspaceFolder.uri.fsPath.includes('manito'));

  if (!isManitoWorkspace) {
    console.log('Not a ManitoDebug workspace, skipping extension prompt');
    return;
  }

  // Check configuration
  const config = vscode.workspace.getConfiguration('manito');
  const shouldPrompt = config.get('autoPromptExtension', true);

  if (!shouldPrompt) {
    console.log('Auto-prompt disabled for this workspace');
    return;
  }

  // Wait a bit for workspace to fully load, then prompt
  setTimeout(() => {
    installer.promptForInstallation();
  }, 2000);

  // Register commands
  const installCommand = vscode.commands.registerCommand('manito.installExtension', () => {
    installer.installExtension();
  });

  const togglePromptCommand = vscode.commands.registerCommand('manito.toggleAutoPrompt', async () => {
    const current = config.get('autoPromptExtension', true);
    await config.update('autoPromptExtension', !current, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(
      `ManitoDebug extension auto-prompt ${!current ? 'enabled' : 'disabled'}`
    );
  });

  context.subscriptions.push(installCommand, togglePromptCommand);

  // Show welcome message
  vscode.window.showInformationMessage(
    '🔍 Welcome to ManitoDebug! This AI-powered code analysis platform is ready to help you understand your codebase.',
    'Install Extension',
    'Learn More'
  ).then(selection => {
    switch (selection) {
      case 'Install Extension':
        installer.installExtension();
        break;
      case 'Learn More':
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/Clapptastic/ManitoDebug'));
        break;
    }
  });
}

function deactivate() {
  console.log('ManitoDebug Bootstrap Extension deactivated');
}

module.exports = {
  activate,
  deactivate
};