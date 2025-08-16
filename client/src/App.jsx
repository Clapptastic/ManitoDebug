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
import ProgressTracker from './components/ProgressTracker'
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
  const [scanProgress, setScanProgress] = useState({ stage: 'idle', progress: 0, files: 0 })
  const [scanStage, setScanStage] = useState('idle')
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

  // Handle WebSocket messages for real-time progress updates
  useEffect(() => {
    if (lastMessage && isScanning) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'scan_progress') {
          setScanProgress({
            stage: data.stage || 'scanning',
            progress: data.progress || 0,
            files: data.files || 0
          });
          setScanStage(data.stage || 'scanning');
        } else if (data.type === 'scan_complete') {
          setScanResults(data.results);
          setIsScanning(false);
          setScanProgress({ stage: 'completed', progress: 100, files: data.results?.files?.length || 0 });
          setScanStage('completed');
          feedback.scanCompleted(data.results?.files?.length || 0, data.results?.conflicts?.length || 0);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, isScanning, feedback])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Settings shortcut (Cmd/Ctrl + ,)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
      
      // AI Panel shortcut (Cmd/Ctrl + Shift + A)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAIPanel(!showAIPanel);
      }
      
      // Scan shortcut (Cmd/Ctrl + Enter)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isScanning && scanPath) {
          handleScan();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isScanning, scanPath, showAIPanel]);

  const handleScan = async () => {
    if (!scanPath || isScanning || !portConfigLoaded) return;
    
    try {
      setIsScanning(true);
      setScanStage('initializing');
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
      
      // Update progress to scanning stage
      setScanStage('scanning');
      setScanProgress({ stage: 'scanning', progress: 10, files: 0 });
      
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
      
      // Update progress to processing stage
      setScanStage('processing');
      setScanProgress({ stage: 'processing', progress: 50, files: 0 });
      
      const result = await response.json();
      console.log('🔍 Response result:', result);
      
      if (result.success) {
        // Update progress to finalizing stage
        setScanStage('finalizing');
        setScanProgress({ stage: 'finalizing', progress: 90, files: result.data.files?.length || 0 });
        
        setScanResults(result.data);
        feedback.scanCompleted(result.data.files?.length || 0, result.data.conflicts?.length || 0);
        
        // Complete the scan
        setScanStage('completed');
        setScanProgress({ stage: 'completed', progress: 100, files: result.data.files?.length || 0 });
      } else {
        console.error('Scan failed:', result.error);
        setScanStage('error');
        setScanProgress({ stage: 'error', progress: 0, files: 0 });
        feedback.scanFailed(result.error || 'Failed to scan project');
      }
    } catch (error) {
      console.error('🔍 Scan error details:', error);
      console.error('🔍 Error stack:', error.stack);
      setScanStage('error');
      setScanProgress({ stage: 'error', progress: 0, files: 0 });
      handleErrorWithFeedback(error, 'scan operation', feedback);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 1000); // Keep progress visible for a moment
    }
  }

  const handleUpload = async (file, projectName) => {
    try {
      setIsScanning(true)
      setScanStage('uploading')
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
      
      setScanStage('processing')
      setScanProgress({ stage: 'processing', progress: 30, files: 0 })
      
      const response = await fetch(`http://localhost:${portConfig.server}/api/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      setScanStage('finalizing')
      setScanProgress({ stage: 'finalizing', progress: 80, files: 0 })
      
      const result = await response.json()
      if (result.success) {
        setScanResults(result.data)
        setScanStage('completed')
        setScanProgress({ stage: 'completed', progress: 100, files: result.data.files?.length || 0 })
        feedback.uploadCompleted(projectName || file.name.replace('.zip', ''))
      } else {
        console.error('Upload failed:', result.error)
        setScanStage('error')
        setScanProgress({ stage: 'error', progress: 0, files: 0 })
        feedback.uploadFailed(result.error || 'Failed to upload and analyze project')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setScanStage('error')
      setScanProgress({ stage: 'error', progress: 0, files: 0 })
      handleErrorWithFeedback(error, 'upload operation', feedback)
    } finally {
      setTimeout(() => {
        setIsScanning(false)
      }, 1000)
    }
  }

  const handleBrowseDirectory = async (directoryData, projectName) => {
    try {
      setIsScanning(true)
      setScanStage('processing')
      setScanProgress({ stage: 'processing', progress: 0, files: directoryData.files.length })
      feedback.scanStarted()
      
      // Validate directory data
      if (!directoryData.files || directoryData.files.length === 0) {
        feedback.scanNoFiles()
        return
      }
      
      setScanStage('analyzing')
      setScanProgress({ stage: 'analyzing', progress: 30, files: directoryData.files.length })
      
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
      
      setScanStage('finalizing')
      setScanProgress({ stage: 'finalizing', progress: 80, files: directoryData.files.length })
      
      const result = await response.json()
      if (result.success) {
        setScanResults(result.data)
        setScanStage('completed')
        setScanProgress({ stage: 'completed', progress: 100, files: result.data.files?.length || 0 })
        feedback.scanCompleted(result.data.files?.length || 0, result.data.conflicts?.length || 0)
      } else {
        console.error('Directory analysis failed:', result.error)
        setScanStage('error')
        setScanProgress({ stage: 'error', progress: 0, files: 0 })
        feedback.scanFailed(result.error || 'Failed to analyze directory')
      }
    } catch (error) {
      console.error('Directory analysis error:', error)
      setScanStage('error')
      setScanProgress({ stage: 'error', progress: 0, files: 0 })
      handleErrorWithFeedback(error, 'directory analysis', feedback)
    } finally {
      setTimeout(() => {
        setIsScanning(false)
      }, 1000)
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
        
        <main className="flex-1 overflow-hidden">
          {isScanning ? (
            <div className="h-full flex items-center justify-center">
              <ScanningLoader 
                progress={scanProgress.progress}
                stage={scanProgress.stage}
                files={scanProgress.files}
              />
            </div>
          ) : scanResults ? (
            <div className="h-full flex flex-col">
              {/* Tab Navigation */}
              <nav className="flex border-b border-gray-800 bg-gray-900">
                {tabConfig.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                      selectedTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {selectedTab === 'graph' && (
                  <GraphVisualization 
                    dependencies={scanResults.dependencies}
                    conflicts={scanResults.conflicts}
                    files={scanResults.files}
                  />
                )}
                {selectedTab === 'metrics' && (
                  <MetricsPanel 
                    metrics={scanResults.metrics}
                    files={scanResults.files}
                    dependencies={scanResults.dependencies}
                  />
                )}
                {selectedTab === 'conflicts' && (
                  <ConflictsList 
                    conflicts={scanResults.conflicts}
                    files={scanResults.files}
                  />
                )}
                {selectedTab === 'files' && (
                  <div className="h-full overflow-auto p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Files Analysis</h2>
                    <div className="grid gap-4">
                      {scanResults.files?.map((file, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <h3 className="text-lg font-medium text-white mb-2">{file.filePath}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Lines:</span>
                              <span className="text-white ml-2">{file.lines}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Size:</span>
                              <span className="text-white ml-2">{file.size} bytes</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Complexity:</span>
                              <span className="text-white ml-2">{file.complexity}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Functions:</span>
                              <span className="text-white ml-2">{file.functions?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to Analyze</h3>
                <p className="text-gray-400 mb-4">
                  Enter a path, upload a file, or browse a directory to start analyzing your code.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>Press</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">⌘</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Enter</kbd>
                  <span>to scan</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker
        isActive={isScanning}
        stage={scanStage}
        progress={scanProgress.progress}
        files={scanProgress.files}
        scanResults={scanResults}
        onComplete={(results) => {
          console.log('Scan completed with results:', results);
        }}
        onError={(error) => {
          console.error('Scan error:', error);
          setIsScanning(false);
          setScanStage('error');
        }}
      />

      {/* AI Panel */}
      {showAIPanel && (
        <AIPanel 
          scanResults={scanResults}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </SettingsProvider>
    </QueryClientProvider>
  )
}

export default App