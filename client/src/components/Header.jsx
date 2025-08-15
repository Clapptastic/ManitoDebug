import React from 'react'
import { 
  Brain, 
  Wifi, 
  WifiOff, 
  Server, 
  Activity, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

const Header = ({ isConnected, healthData, onToggleAI }) => {
  const getHealthStatus = () => {
    if (!healthData) {
      return { status: 'unknown', color: 'text-gray-400', icon: Clock }
    }

    if (healthData.status === 'healthy') {
      return { status: 'healthy', color: 'text-green-400', icon: CheckCircle }
    } else if (healthData.status === 'warning') {
      return { status: 'warning', color: 'text-yellow-400', icon: AlertCircle }
    } else {
      return { status: 'error', color: 'text-red-400', icon: AlertCircle }
    }
  }

  const healthStatus = getHealthStatus()
  const HealthIcon = healthStatus.icon

  return (
    <header className="glass-panel m-4 mb-0 p-4">
      <div className="flex items-center justify-between">
        {/* Left side - App title and status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">ManitoDebug</h1>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Health Status */}
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-400" />
            <HealthIcon className={`w-4 h-4 ${healthStatus.color}`} />
            <span className={`text-sm ${healthStatus.color}`}>
              {healthData?.status || 'Unknown'}
            </span>
            {healthData?.uptime && (
              <span className="text-xs text-gray-500">
                ({Math.floor(healthData.uptime / 60)}m)
              </span>
            )}
          </div>
        </div>

        {/* Right side - Controls and stats */}
        <div className="flex items-center space-x-4">
          {/* Health metrics */}
          {healthData && (
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {healthData.memory && (
                <div className="flex items-center space-x-1">
                  <span>Memory:</span>
                  <span className="text-gray-200">
                    {Math.round(healthData.memory.used / 1024 / 1024)}MB
                  </span>
                </div>
              )}
              {healthData.cpu && (
                <div className="flex items-center space-x-1">
                  <span>CPU:</span>
                  <span className="text-gray-200">
                    {Math.round(healthData.cpu)}%
                  </span>
                </div>
              )}
              {healthData.activeScans && (
                <div className="flex items-center space-x-1">
                  <span>Active Scans:</span>
                  <span className="text-gray-200">
                    {healthData.activeScans}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AI Toggle Button */}
          <button
            onClick={onToggleAI}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            <Brain className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>

          {/* Settings Button */}
          <button className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header