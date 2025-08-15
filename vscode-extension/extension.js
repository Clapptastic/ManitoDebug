const vscode = require('vscode');
const WebSocket = require('ws');
const path = require('path');

let manitoPanel = null;
let ws = null;
let outputChannel = null;
let dependencyProvider = null;

function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Manito Debug');
    outputChannel.appendLine('Manito Debug extension activated');
    
    dependencyProvider = new ManitoTreeProvider();
    vscode.window.registerTreeDataProvider('manitoDependencies', dependencyProvider);
    
    const commands = [
        vscode.commands.registerCommand('manito.scanWorkspace', scanWorkspace),
        vscode.commands.registerCommand('manito.showGraph', showDependencyGraph),
        vscode.commands.registerCommand('manito.openDashboard', openDashboard),
        vscode.commands.registerCommand('manito.analyzeDependencies', analyzeDependencies),
        vscode.commands.registerCommand('manito.findConflicts', findConflicts),
        vscode.commands.registerCommand('manito.installExtension', installExtension)
    ];
    
    context.subscriptions.push(...commands);
    setupStatusBar(context);
    connectToServer();
    
    if (shouldShowWelcome()) {
        showWelcomeMessage();
    }
}

function setupStatusBar(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(graph) Manito';
    statusBarItem.tooltip = 'Open Manito Dashboard';
    statusBarItem.command = 'manito.openDashboard';
    statusBarItem.show();
    
    context.subscriptions.push(statusBarItem);
}

function connectToServer() {
    const config = vscode.workspace.getConfiguration('manito');
    const serverUrl = config.get('serverUrl', 'http://localhost:3000');
    const wsUrl = serverUrl.replace('http', 'ws');
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.on('open', () => {
            outputChannel.appendLine('Connected to Manito server');
            vscode.commands.executeCommand('setContext', 'manito.connected', true);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleServerMessage(message);
            } catch (error) {
                outputChannel.appendLine('WebSocket message error: ' + error.message);
            }
        });
        
        ws.on('close', () => {
            outputChannel.appendLine('Disconnected from Manito server');
            vscode.commands.executeCommand('setContext', 'manito.connected', false);
            setTimeout(connectToServer, 5000);
        });
        
        ws.on('error', (error) => {
            outputChannel.appendLine('WebSocket error: ' + error.message);
        });
        
    } catch (error) {
        outputChannel.appendLine('Failed to connect to Manito server: ' + error.message);
        vscode.window.showWarningMessage(
            'Could not connect to Manito server. Make sure the server is running on ' + serverUrl
        );
    }
}

function handleServerMessage(message) {
    switch (message.channel) {
        case 'scan':
            if (message.data.status === 'completed') {
                vscode.window.showInformationMessage(
                    'Scan completed: ' + message.data.summary.files + ' files, ' + message.data.summary.conflicts + ' conflicts'
                );
                dependencyProvider.refresh();
                vscode.commands.executeCommand('setContext', 'manito.hasResults', true);
            } else if (message.data.status === 'failed') {
                vscode.window.showErrorMessage('Scan failed: ' + message.data.error);
            }
            break;
            
        case 'ai':
            if (message.data.status === 'response') {
                showAIResponse(message.data.response);
            }
            break;
    }
}

async function scanWorkspace(uri) {
    const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }
    
    const scanPath = uri ? uri.fsPath : workspaceFolder.uri.fsPath;
    const config = vscode.workspace.getConfiguration('manito');
    const excludePatterns = config.get('excludePatterns', []);
    
    try {
        const response = await fetch(config.get('serverUrl') + '/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: scanPath,
                options: {
                    patterns: ['**/*.{js,jsx,ts,tsx}'],
                    excludePatterns: excludePatterns
                }
            })
        });
        
        if (response.ok) {
            outputChannel.appendLine('Scan started for: ' + scanPath);
            vscode.window.showInformationMessage('Code scan started...');
        } else {
            throw new Error('HTTP ' + response.status);
        }
        
    } catch (error) {
        outputChannel.appendLine('Scan failed: ' + error.message);
        vscode.window.showErrorMessage('Failed to start scan: ' + error.message);
    }
}

function showDependencyGraph() {
    if (manitoPanel) {
        manitoPanel.reveal();
        return;
    }
    
    manitoPanel = vscode.window.createWebviewPanel(
        'manitoGraph',
        'Manito Dependency Graph',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    manitoPanel.webview.html = getGraphWebviewContent();
    
    manitoPanel.onDidDispose(() => {
        manitoPanel = null;
    });
    
    manitoPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'openFile':
                const document = await vscode.workspace.openTextDocument(message.filePath);
                vscode.window.showTextDocument(document);
                break;
        }
    });
}

function openDashboard() {
    const config = vscode.workspace.getConfiguration('manito');
    const serverUrl = config.get('serverUrl', 'http://localhost:3000');
    
    vscode.env.openExternal(vscode.Uri.parse(serverUrl));
}

async function analyzeDependencies() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }
    
    const filePath = editor.document.uri.fsPath;
    vscode.window.showInformationMessage('Analyzing dependencies for: ' + path.basename(filePath));
    outputChannel.appendLine('Analyzing dependencies for: ' + filePath);
}

async function findConflicts() {
    vscode.window.showInformationMessage('Searching for dependency conflicts...');
    outputChannel.appendLine('Finding conflicts...');
}

function installExtension() {
    vscode.window.showInformationMessage(
        'Manito extension is already installed and active!',
        'Open Dashboard',
        'Scan Workspace'
    ).then((selection) => {
        if (selection === 'Open Dashboard') {
            openDashboard();
        } else if (selection === 'Scan Workspace') {
            scanWorkspace();
        }
    });
}

class ManitoTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
    }
    
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element) {
        return element;
    }
    
    getChildren(element) {
        if (!element) {
            return [
                new ManitoTreeItem('Files Scanned', '0', vscode.TreeItemCollapsibleState.Collapsed),
                new ManitoTreeItem('Dependencies', '0', vscode.TreeItemCollapsibleState.Collapsed),
                new ManitoTreeItem('Conflicts', '0', vscode.TreeItemCollapsibleState.Collapsed)
            ];
        }
        return [];
    }
}

class ManitoTreeItem extends vscode.TreeItem {
    constructor(label, badge, collapsibleState) {
        super(label, collapsibleState);
        this.description = badge;
        this.contextValue = 'manitoItem';
    }
}

function getGraphWebviewContent() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manito Dependency Graph</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            width: 100%;
            height: calc(100vh - 40px);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="loading">Loading Manito dependency graph...</div>
        <iframe src="http://localhost:3000" title="Manito Dashboard" onload="document.querySelector('.loading').style.display='none'"></iframe>
    </div>
</body>
</html>`;
}

function showAIResponse(response) {
    const message = 'AI Analysis: ' + response.response;
    vscode.window.showInformationMessage(message, 'View Details').then((selection) => {
        if (selection === 'View Details') {
            outputChannel.appendLine('AI Analysis Results:');
            outputChannel.appendLine('Response: ' + response.response);
            outputChannel.appendLine('Confidence: ' + (response.confidence * 100).toFixed(1) + '%');
            outputChannel.appendLine('Suggestions:');
            response.suggestions.forEach((suggestion, index) => {
                outputChannel.appendLine((index + 1) + '. ' + suggestion);
            });
            outputChannel.show();
        }
    });
}

function shouldShowWelcome() {
    const config = vscode.workspace.getConfiguration('manito');
    return config.get('autoPromptExtension', true);
}

function showWelcomeMessage() {
    vscode.window.showInformationMessage(
        'Welcome to Manito Debug! Analyze your code dependencies and conflicts.',
        'Scan Workspace',
        'Open Dashboard',
        'Learn More'
    ).then((selection) => {
        switch (selection) {
            case 'Scan Workspace':
                scanWorkspace();
                break;
            case 'Open Dashboard':
                openDashboard();
                break;
            case 'Learn More':
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/Clapptastic/ManitoDebug'));
                break;
        }
    });
}

function deactivate() {
    if (ws) {
        ws.close();
    }
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (manitoPanel) {
        manitoPanel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};