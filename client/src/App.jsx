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
import { ToastProvider, useToast } from './components/Toast'
import { ScanningLoader, LoadingOverlay } from './components/Loading'
import Tooltip from './components/Tooltip'
import useWebSocket from './hooks/useWebSocket'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function AppContent() {
  const [scanPath, setScanPath] = useState('./src')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [selectedTab, setSelectedTab] = useState('graph')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [scanProgress, setScanProgress] = useState({ stage: 'initializing', progress: 0, files: 0 })
  const { toast } = useToast()

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:3000')

  // Health check query
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('/api/health')
      return response.json()
    },
    refetchInterval: 30000, // 30 seconds
  })

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
          toast.loading('Starting code analysis...', { title: 'Scanning' })
        } else if (message.data.status === 'progress') {
          setScanProgress({
            stage: message.data.stage || 'analyzing',
            progress: message.data.progress || 0,
            files: message.data.filesProcessed || 0
          })
        } else if (message.data.status === 'completed') {
          setIsScanning(false)
          setScanProgress({ stage: 'finalizing', progress: 100, files: message.data.filesProcessed || 0 })
          toast.scanComplete({ 
            files: message.data.filesProcessed || 0, 
            conflicts: message.data.conflicts || 0 
          })
          // Refresh scan results
          fetchScanResults()
        } else if (message.data.status === 'failed') {
          setIsScanning(false)
          console.error('Scan failed:', message.data.error)
          toast.error(`Scan failed: ${message.data.error}`, { 
            title: 'Scan Error' 
          })
        }
      }
    }
  }, [lastMessage, toast])

  const handleScan = async () => {
    try {
      setIsScanning(true)
      setScanProgress({ stage: 'initializing', progress: 0, files: 0 })
      
      const loadingToastId = toast.loading(`Scanning ${scanPath}...`, { 
        title: 'Code Analysis Started',
        progress: 0
      })
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: scanPath,
          options: {
            patterns: ['**/*.{js,jsx,ts,tsx}'],
            excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
          }
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setScanResults(result.data)
        toast.scanComplete({
          files: result.data.files?.length || 0,
          conflicts: result.data.conflicts?.length || 0
        })
      } else {
        console.error('Scan failed:', result.error)
        toast.error(result.error || 'Failed to scan project', {
          title: 'Scan Failed'
        })
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Network error occurred while scanning', {
        title: 'Connection Error'
      })
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
    <ToastProvider>
      <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
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
          isScanning={isScanning}
          scanResults={scanResults}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="glass-panel m-4 p-4 flex items-center justify-between">
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
    </ToastProvider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App