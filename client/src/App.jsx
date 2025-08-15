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

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data)
      console.log('WebSocket message:', message)
      
      if (message.channel === 'scan') {
        if (message.data.status === 'started') {
          setIsScanning(true)
        } else if (message.data.status === 'completed') {
          setIsScanning(false)
          // Refresh scan results
          fetchScanResults()
        } else if (message.data.status === 'failed') {
          setIsScanning(false)
          console.error('Scan failed:', message.data.error)
        }
      }
    }
  }, [lastMessage])

  const handleScan = async () => {
    try {
      setIsScanning(true)
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
      } else {
        console.error('Scan failed:', result.error)
      }
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setIsScanning(false)
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
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <Header 
        isConnected={isConnected} 
        healthData={healthData}
        onToggleAI={() => setShowAIPanel(!showAIPanel)}
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
              {tabConfig.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedTab(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
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
              ))}
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
              {!scanResults ? (
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
    </div>
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