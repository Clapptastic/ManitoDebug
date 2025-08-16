import React, { useState } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  ArrowRight,
  FileText,
  GitBranch,
  Zap,
  Clock
} from 'lucide-react'

function ConflictsList({ conflicts = [] }) {
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConflict, setSelectedConflict] = useState(null)

  // Validate conflicts data
  const validConflicts = React.useMemo(() => {
    if (!Array.isArray(conflicts)) {
      console.warn('ConflictsList: conflicts prop is not an array', conflicts)
      return []
    }
    
    return conflicts.filter(conflict => {
      if (!conflict || typeof conflict !== 'object') {
        console.warn('ConflictsList: invalid conflict object', conflict)
        return false
      }
      
      if (!conflict.message || !conflict.severity || !conflict.type) {
        console.warn('ConflictsList: conflict missing required fields', conflict)
        return false
      }
      
      return true
    })
  }, [conflicts])

  const severityConfig = {
    error: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      badge: 'badge-error'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      badge: 'badge-warning'
    },
    info: {
      icon: Info,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      badge: 'badge-info'
    }
  }

  const conflictTypes = {
    circular_dependency: {
      label: 'Circular Dependency',
      icon: RefreshCw,
      description: 'Circular dependencies can cause runtime issues and make code harder to understand'
    },
    isolated_file: {
      label: 'Isolated File',
      icon: FileText,
      description: 'Files with no dependencies might be unused or dead code'
    },
    duplicate_dependency: {
      label: 'Duplicate Dependency',
      icon: GitBranch,
      description: 'Multiple files importing the same dependency inefficiently'
    },
    performance_issue: {
      label: 'Performance Issue',
      icon: Zap,
      description: 'Code patterns that may impact performance'
    },
    outdated_dependency: {
      label: 'Outdated Dependency',
      icon: Clock,
      description: 'Dependencies that should be updated for security or features'
    }
  }

  // Filter conflicts
  const filteredConflicts = validConflicts.filter(conflict => {
    const matchesSeverity = filterSeverity === 'all' || conflict.severity === filterSeverity
    const matchesType = filterType === 'all' || conflict.type === filterType
    const matchesSearch = searchTerm === '' || 
      conflict.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conflict.files && Array.isArray(conflict.files) && conflict.files.some(file => 
        typeof file === 'string' && file.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    
    return matchesSeverity && matchesType && matchesSearch
  })

  // Group conflicts by severity
  const conflictsBySeverity = {
    error: filteredConflicts.filter(c => c.severity === 'error'),
    warning: filteredConflicts.filter(c => c.severity === 'warning'),
    info: filteredConflicts.filter(c => c.severity === 'info')
  }

  const getConflictIcon = (type) => {
    return conflictTypes[type]?.icon || AlertCircle
  }

  const formatFilePath = (filePath) => {
    if (!filePath || typeof filePath !== 'string') {
      return 'Unknown file'
    }
    
    const parts = filePath.split('/')
    if (parts.length > 3) {
      return `.../${parts.slice(-3).join('/')}`
    }
    return filePath
  }

  const getSuggestion = (conflict) => {
    switch (conflict.type) {
      case 'circular_dependency':
        return 'Consider refactoring to break the circular dependency by introducing an interface or moving shared logic to a separate module.'
      case 'isolated_file':
        return 'Review if this file is still needed. If unused, consider removing it to reduce codebase size.'
      case 'duplicate_dependency':
        return 'Consolidate imports or create a shared utility module to avoid duplication.'
      case 'performance_issue':
        return 'Optimize the identified code pattern for better performance.'
      case 'outdated_dependency':
        return 'Update the dependency to the latest stable version.'
      default:
        return 'Review and address this issue based on your project requirements.'
    }
  }

  // Show empty state if no valid conflicts
  if (validConflicts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-300">No Conflicts Found</h3>
            <p className="text-gray-500">
              {Array.isArray(conflicts) && conflicts.length > 0 
                ? 'All detected conflicts have been resolved or are not critical.'
                : 'Run a scan to detect potential code conflicts and issues.'
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Code Conflicts</h2>
          <p className="text-gray-400">Issues that may impact code quality and maintainability</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conflicts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-4 py-2 w-64 text-sm"
            />
          </div>

          {/* Filters */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="input-field py-2 px-3 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field py-2 px-3 text-sm"
          >
            <option value="all">All Types</option>
            {Object.entries(conflictTypes).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(conflictsBySeverity).map(([severity, conflicts]) => {
          const config = severityConfig[severity]
          const Icon = config.icon
          return (
            <div key={severity} className={`metric-card ${config.bgColor} border ${config.borderColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${config.color}`}>
                    {conflicts.length}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">{severity}s</div>
                </div>
                <Icon className={`w-8 h-8 ${config.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Conflicts List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {filteredConflicts.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No conflicts match your current filters</p>
          </div>
        ) : (
          filteredConflicts.map((conflict, index) => {
            const config = severityConfig[conflict.severity] || severityConfig.info
            const Icon = config.icon
            const TypeIcon = getConflictIcon(conflict.type)
            const conflictTypeConfig = conflictTypes[conflict.type]

            return (
              <div
                key={index}
                className={`glass-panel p-4 hover:bg-gray-800/70 transition-all duration-200 cursor-pointer border-l-4 ${config.borderColor.replace('border-', 'border-l-')}`}
                onClick={() => setSelectedConflict(selectedConflict === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <TypeIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">
                          {conflictTypeConfig?.label || 'Unknown Issue'}
                        </h3>
                        <span className={`badge ${config.badge}`}>
                          {conflict.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        {conflict.message}
                      </p>

                      {conflict.files && conflict.files.length > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <FileText className="w-3 h-3" />
                          <span>
                            {conflict.files.length === 1 
                              ? formatFilePath(conflict.files[0])
                              : `${conflict.files.length} files affected`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <ArrowRight 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        selectedConflict === index ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedConflict === index && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Description */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {conflictTypeConfig?.description || 'No description available.'}
                          </p>
                        </div>

                        {/* Affected Files */}
                        {conflict.files && conflict.files.length > 1 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Affected Files</h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {conflict.files.map((file, fileIndex) => (
                                <div 
                                  key={fileIndex}
                                  className="flex items-center space-x-2 text-xs font-mono bg-gray-800/50 px-2 py-1 rounded"
                                >
                                  <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  <span className="text-gray-300 truncate">{file}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Suggestion */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">💡 Suggested Fix</h4>
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-sm text-blue-200 leading-relaxed">
                              {getSuggestion(conflict)}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button className="btn-secondary btn-sm">
                            View in Editor
                          </button>
                          <button className="btn-ghost btn-sm">
                            Mark as Fixed
                          </button>
                          <button className="btn-ghost btn-sm">
                            Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-400">
            <span>Total Conflicts: <span className="text-white font-semibold">{conflicts.length}</span></span>
            <span>•</span>
            <span>Showing: <span className="text-white font-semibold">{filteredConflicts.length}</span></span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <RefreshCw className="w-4 h-4" />
            <span>Last updated: just now</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConflictsList