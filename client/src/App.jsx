import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Play, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  BarChart3,
  Network,
  FileText,
  Brain
} from 'lucide-react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import GraphVisualization from './components/GraphVisualization'
import MetricsPanel from './components/MetricsPanel'
import ConflictsList from './components/ConflictsList'
import AIPanel from './components/AIPanel'
import SettingsModal from './components/SettingsModal'
import MockDataAlert from './components/MockDataAlert'
import { ToastProvider, useToast } from './components/Toast'
import { SettingsProvider } from './contexts/SettingsContext'
import { ScanningLoader, LoadingOverlay } from './components/Loading'
import Tooltip from './components/Tooltip'
import useWebSocket from './hooks/useWebSocket'
import { useUserFeedback, handleErrorWithFeedback, handleSuccessWithFeedback } from './utils/userFeedback'
import dynamicPortConfig from './utils/portConfig.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function AppContent() {
  const [scanPath, setScanPath] = useState('/Users/andrewclapp/Desktop/ai debug planning/manito-package/client/src')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [selectedTab, setSelectedTab] = useState('graph')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [scanProgress, setScanProgress] = useState({ stage: 'initializing', progress: 0, files: 0 })
  const { toast } = useToast()
  const feedback = useUserFeedback()

  // Get port configuration
  const [portConfig, setPortConfig] = useState({
    server: 3000,
    client: 5173,
    websocket: 3001
  });
  const [portConfigLoaded, setPortConfigLoaded] = useState(false);

  useEffect(() => {
    const initializePorts = async () => {
      try {
        await dynamicPortConfig.initialize();
        const config = dynamicPortConfig.getConfig();
        setPortConfig(config);
        setPortConfigLoaded(true);
        console.log('🔧 Dynamic port configuration loaded:', config);
      } catch (error) {
        console.error('❌ Failed to initialize port configuration:', error);
        // Keep the default configuration
        setPortConfigLoaded(true);
      }
    };

    initializePorts();
  }, []);

  console.log('🔧 Port configuration:', portConfig);
  console.log('🔧 Environment variables:', {
    VITE_SERVER_PORT: import.meta.env.VITE_SERVER_PORT,
    NODE_ENV: import.meta.env.NODE_ENV
  });
  
  const { isConnected, lastMessage } = useWebSocket(`ws://localhost:${portConfig.server}/ws`)

  // Health check query
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`http://localhost:${portConfig.server}/api/health?detailed=true`)
      return response.json()
    },
    refetchInterval: 30000, // 30 seconds
  })

  // Removed permanent welcome toast notification

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Settings shortcut (Cmd/Ctrl + ,)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
        return
      }
      
      // AI shortcut (Alt + A)
      if (e.altKey && e.key === 'a') {
        e.preventDefault()
        setShowAIPanel(!showAIPanel)
        return
      }
      
      // Start scan shortcut (Cmd/Ctrl + Enter)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && scanPath && !isScanning) {
        e.preventDefault()
        handleScan()
        return
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false)
        } else if (showAIPanel) {
          setShowAIPanel(false)
        }
        return
      }
      
      // Tab navigation (1-4 for tabs)
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4'].includes(e.key) && scanResults) {
        e.preventDefault()
        const tabMap = { '1': 'graph', '2': 'metrics', '3': 'conflicts', '4': 'files' }
        setSelectedTab(tabMap[e.key])
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, showAIPanel, scanPath, isScanning, scanResults])

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data)
      console.log('WebSocket message:', message)
      
      if (message.channel === 'scan') {
        if (message.data.status === 'started') {
          setIsScanning(true)
          setScanProgress({ stage: 'initializing', progress: 0, files: 0 })
          feedback.scanStarted()
        } else if (message.data.status === 'progress') {
          setScanProgress({
            stage: message.data.stage || 'analyzing',
            progress: message.data.progress || 0,
            files: message.data.filesProcessed || 0
          })
          feedback.scanProgress(message.data.filesProcessed || 0, message.data.stage || 'analyzing')
        } else if (message.data.status === 'completed') {
          setIsScanning(false)
          setScanProgress({ stage: 'finalizing', progress: 100, files: message.data.filesProcessed || 0 })
          feedback.scanCompleted(message.data.filesProcessed || 0, message.data.conflicts || 0)
          // Refresh scan results
          fetchScanResults()
        } else if (message.data.status === 'failed') {
          setIsScanning(false)
          console.error('Scan failed:', message.data.error)
          feedback.scanFailed(message.data.error)
        }
      } else if (message.channel === 'connection') {
        if (message.data.status === 'connected') {
          feedback.systemConnected()
        } else if (message.data.status === 'disconnected') {
          feedback.systemDisconnected()
        } else if (message.data.status === 'reconnecting') {
          feedback.systemReconnecting()
        }
      }
    }
  }, [lastMessage, feedback])

  const handleScan = async () => {
    if (!scanPath || isScanning || !portConfigLoaded) return;
    
    try {
      setIsScanning(true);
      setScanProgress({ stage: 'initializing', progress: 0, files: 0 });
      feedback.scanStarted();
      
      console.log('🔍 Starting scan with path:', scanPath);
      console.log('🔍 Port config:', portConfig);
      
      const serverUrl = dynamicPortConfig.getServerUrl();
      console.log('🔍 Request URL:', `${serverUrl}/api/scan`);
      
      const requestBody = {
        path: scanPath,
        options: {
          patterns: ['**/*.{js,jsx,ts,tsx}'],
          excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
        }
      };
      
      console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${serverUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('🔍 Response status:', response.status, response.statusText);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🔍 Response result:', result);
      
      if (result.success) {
        setScanResults(result.data);
        feedback.scanCompleted(result.data.files?.length || 0, result.data.conflicts?.length || 0);
      } else {
        console.error('Scan failed:', result.error);
        feedback.scanFailed(result.error || 'Failed to scan project');
      }
    } catch (error) {
      console.error('🔍 Scan error details:', error);
      console.error('🔍 Error stack:', error.stack);
      handleErrorWithFeedback(error, 'scan operation', feedback);
    } finally {
      setIsScanning(false);
      setScanProgress({ stage: 'finalizing', progress: 100, files: 0 });
    }
  }

  const handleUpload = async (file, projectName) => {
    try {
      setIsScanning(true)
      setScanProgress({ stage: 'uploading', progress: 0, files: 0 })
      feedback.uploadStarted()
      
      // Validate file
      if (!file.name.endsWith('.zip')) {
        feedback.uploadInvalidFile()
        return
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        feedback.uploadFileTooLarge()
        return
      }
      
      const formData = new FormData()
      formData.append('projectFile', file)
      formData.append('projectName', projectName || file.name.replace('.zip', ''))
      formData.append('patterns', JSON.stringify(['**/*.{js,jsx,ts,tsx}']))
      formData.append('excludePatterns', JSON.stringify(['node_modules/**', 'dist/**', 'build/**', '.git/**']))
      
      const response = await fetch(`http://localhost:${portConfig.server}/api/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setScanResults(result.data)
        feedback.uploadCompleted(projectName || file.name.replace('.zip', ''))
      } else {
        console.error('Upload failed:', result.error)
        feedback.uploadFailed(result.error || 'Failed to upload and analyze project')
      }
    } catch (error) {
      console.error('Upload error:', error)
      handleErrorWithFeedback(error, 'upload operation', feedback)
    } finally {
      setIsScanning(false)
      setScanProgress({ stage: 'finalizing', progress: 100, files: 0 })
    }
  }

  const handleBrowseDirectory = async (directoryData, projectName) => {
    try {
      setIsScanning(true)
      setScanProgress({ stage: 'processing', progress: 0, files: directoryData.files.length })
      feedback.scanStarted()
      
      // Validate directory data
      if (!directoryData.files || directoryData.files.length === 0) {
        feedback.scanNoFiles()
        return
      }
      
      const response = await fetch(`http://localhost:${portConfig.server}/api/upload-directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: {
            name: directoryData.name,
            files: directoryData.files.map(file => ({
              path: file.path,
              content: file.content,
              size: file.size
            }))
          },
          projectName: projectName || directoryData.name,
          source: 'browser-directory'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setScanResults(result.data)
        feedback.scanCompleted(result.data.files?.length || 0, result.data.conflicts?.length || 0)
      } else {
        console.error('Directory analysis failed:', result.error)
        feedback.scanFailed(result.error || 'Failed to analyze directory')
      }
    } catch (error) {
      console.error('Directory analysis error:', error)
      handleErrorWithFeedback(error, 'directory analysis', feedback)
    } finally {
      setIsScanning(false)
      setScanProgress({ stage: 'finalizing', progress: 100, files: 0 })
    }
  }

  const fetchScanResults = async () => {
    // This would normally fetch existing scan results by ID
    // For now, we'll use mock data
  }

  const tabConfig = [
    { id: 'graph', label: 'Dependency Graph', icon: Network },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'conflicts', label: 'Conflicts', icon: AlertCircle },
    { id: 'files', label: 'Files', icon: FileText },
  ]

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-visible">
        <Header 
          isConnected={isConnected} 
          healthData={healthData}
          onToggleAI={() => setShowAIPanel(!showAIPanel)}
          onOpenSettings={() => setShowSettings(true)}
        />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          scanPath={scanPath}
          setScanPath={setScanPath}
          onScan={handleScan}
          onUpload={handleUpload}
          onBrowseDirectory={handleBrowseDirectory}
          isScanning={isScanning}
          scanResults={scanResults}
          onOpenSettings={() => setShowSettings(true)}
        />
        
        <main className="flex-1 flex flex-col overflow-visible">
          {/* Toolbar */}
          <div className="glass-panel m-4 p-4 flex items-center justify-between overflow-visible">
            <div className="flex space-x-4">
              {tabConfig.map(({ id, label, icon: Icon }, index) => {
                const shortcutNumber = index + 1
                return (
                  <Tooltip 
                    key={id}
                    content={
                      <div className="text-center">
                        <div className="font-semibold">{label}</div>
                        <div className="text-xs text-gray-300 mt-1">
                          Press ⌘{shortcutNumber} to switch
                        </div>
                      </div>
                    }
                  >
                    <button
                      onClick={() => setSelectedTab(id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500/50 focus:outline-none ${
                        selectedTab === id 
                          ? 'bg-primary-600 text-white' 
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                      {id === 'conflicts' && scanResults?.conflicts?.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {scanResults.conflicts.length}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                )
              })}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-400">
                {scanResults && (
                  <span>
                    {scanResults.files?.length || 0} files • {scanResults.conflicts?.length || 0} conflicts
                  </span>
                )}
              </div>
              
              <div className={`status-indicator ${isConnected ? 'status-success' : 'status-error'}`} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 px-4 pb-4 overflow-hidden">
            <div className="glass-panel h-full p-4 overflow-auto">
              {isScanning ? (
                <div className="flex items-center justify-center h-full">
                  <ScanningLoader 
                    stage={scanProgress.stage}
                    progress={scanProgress.progress}
                    files={scanProgress.files}
                  />
                </div>
              ) : !scanResults ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-4">
                    <Network className="w-16 h-16 text-gray-600 mx-auto" />
                    <h3 className="text-xl font-semibold text-gray-300">No Scan Results</h3>
                    <p className="text-gray-500 max-w-md">
                      Start by entering a path and running a scan to analyze your codebase 
                      dependencies, conflicts, and metrics.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mock Data Alert */}
                  <MockDataAlert 
                    scanResults={scanResults}
                    onOpenSettings={() => setShowSettings(true)}
                    onRunScan={() => handleScan()}
                  />
                  
                  {selectedTab === 'graph' && (
                    <GraphVisualization data={scanResults} />
                  )}
                  {selectedTab === 'metrics' && (
                    <MetricsPanel data={scanResults} />
                  )}
                  {selectedTab === 'conflicts' && (
                    <ConflictsList conflicts={scanResults.conflicts || []} />
                  )}
                  {selectedTab === 'files' && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Scanned Files</h2>
                      <div className="grid gap-2">
                        {scanResults.files?.map((file, index) => (
                          <div key={index} className="glass-panel p-3 hover:bg-gray-800/70 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="font-mono text-sm text-gray-300">
                                {file.filePath}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{file.lines} lines</span>
                                <span>{(file.size / 1024).toFixed(1)}KB</span>
                                <span>Complexity: {file.complexity}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
        
        {showAIPanel && (
          <AIPanel 
            scanResults={scanResults}
            onClose={() => setShowAIPanel(false)}
          />
        )}
      </div>
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App