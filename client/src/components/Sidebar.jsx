import React, { useState, useRef } from 'react'
import {
  FolderOpen,
  Play,
  Square,
  Loader2,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  RefreshCw,
  Zap,
  Clock,
  HardDrive
} from 'lucide-react'
import Tooltip, { HelpTooltip, KeyboardTooltip } from './Tooltip'

function Sidebar({ scanPath, setScanPath, onScan, isScanning, scanResults }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].webkitGetAsEntry) {
      const entry = files[0].webkitGetAsEntry()
      if (entry && entry.isDirectory) {
        setScanPath(files[0].path)
      }
    }
  }

  const handleFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setScanPath(files[0].webkitRelativePath.split('/')[0])
    }
  }

  const formatFileCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count
  }

  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`
    }
    return `${bytes}B`
  }

  return (
    <aside className="w-80 glass-panel m-4 mr-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary-400" />
            <span>Code Scanner</span>
          </h2>
          <HelpTooltip content="Configure scan settings and analysis options">
            <button className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors focus:ring-2 focus:ring-blue-500/50 focus:outline-none">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </HelpTooltip>
        </div>

        {/* Path Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center space-x-2">
            <span>Project Path</span>
            <HelpTooltip content="Enter the path to your project directory or drag & drop a folder below" />
          </label>
          <div className="relative">
            <input
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              placeholder="Enter project path..."
              className="input-field w-full pr-12 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
            />
            <Tooltip content="Browse for folder" position="top">
              <button
                onClick={handleFolderSelect}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-600/50 transition-colors focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              >
                <FolderOpen className="w-4 h-4 text-gray-400" />
              </button>
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              webkitdirectory=""
              directory=""
            />
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`mt-4 p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
            isDragOver
              ? 'border-primary-400 bg-primary-400/10'
              : 'border-gray-600/50 hover:border-gray-500/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Drag & drop a folder here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse
            </p>
          </div>
        </div>

        {/* Scan Button */}
        <KeyboardTooltip 
          shortcut="Cmd+Enter" 
          description={isScanning ? "Scanning in progress..." : "Start code analysis"}
        >
          <button
            onClick={onScan}
            disabled={isScanning || !scanPath}
            className={`w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none ${
              isScanning
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : !scanPath
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'btn-primary hover:shadow-lg hover:shadow-primary-500/20 transform hover:scale-[1.02]'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Analysis</span>
              </>
            )}
          </button>
        </KeyboardTooltip>
      </div>

      {/* Scan Results Summary */}
      {scanResults && (
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">Scan Results</h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{Math.round(scanResults.scanTime)}ms</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Tooltip content={`${scanResults.files?.length || 0} files analyzed`} position="top">
              <div className="metric-card hover:bg-gray-800/50 transition-colors cursor-help">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {formatFileCount(scanResults.files?.length || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Files</div>
                  </div>
                </div>
              </div>
            </Tooltip>

            <Tooltip content={`${scanResults.metrics?.linesOfCode?.toLocaleString() || 0} lines of code analyzed`} position="top">
              <div className="metric-card hover:bg-gray-800/50 transition-colors cursor-help">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {scanResults.metrics?.linesOfCode?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-400">Lines</div>
                  </div>
                </div>
              </div>
            </Tooltip>

            <Tooltip 
              content={
                scanResults.conflicts?.length > 0 
                  ? `${scanResults.conflicts.length} conflicts detected - click to view details`
                  : "No conflicts found - great job!"
              } 
              position="top"
            >
              <div className={`metric-card hover:bg-gray-800/50 transition-colors cursor-help ${
                scanResults.conflicts?.length > 0 ? 'ring-1 ring-yellow-500/20' : ''
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    scanResults.conflicts?.length > 0 ? 'text-yellow-400' : 'text-gray-500'
                  }`} />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {scanResults.conflicts?.length || 0}
                    </div>
                    <div className="text-xs text-gray-400">Conflicts</div>
                  </div>
                </div>
              </div>
            </Tooltip>

            <Tooltip 
              content={`Total codebase size: ${formatSize(scanResults.files?.reduce((acc, f) => acc + (f.size || 0), 0) || 0)}`} 
              position="top"
            >
              <div className="metric-card hover:bg-gray-800/50 transition-colors cursor-help">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {formatSize(scanResults.files?.reduce((acc, f) => acc + (f.size || 0), 0) || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Size</div>
                  </div>
                </div>
              </div>
            </Tooltip>
          </div>

          {/* Health Score */}
          {scanResults && (
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Health Score</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {Math.max(0, 100 - (scanResults.conflicts?.length || 0) * 10)}%
                  </div>
                  <div className="text-xs text-green-300/70">
                    {scanResults.conflicts?.length === 0 ? 'Excellent' : 
                     scanResults.conflicts?.length < 3 ? 'Good' : 
                     scanResults.conflicts?.length < 6 ? 'Fair' : 'Needs Work'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Tree Preview */}
      <div className="flex-1 overflow-hidden">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Files</h3>
          <div className="space-y-2 overflow-y-auto max-h-64">
            {scanResults?.files?.slice(0, 10).map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer group"
              >
                <FileText className="w-4 h-4 text-gray-400 group-hover:text-gray-300" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300 truncate">
                    {file.filePath?.split('/').pop() || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>{file.lines || 0} lines</span>
                    <span>•</span>
                    <span>{formatSize(file.size || 0)}</span>
                    {file.complexity > 5 && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-400">Complex</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <RefreshCw className="w-3 h-3" />
            <span>Last scan: {scanResults ? new Date(scanResults.timestamp).toLocaleTimeString() : 'Never'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar