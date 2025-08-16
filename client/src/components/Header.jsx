import React from 'react'
import { 
  Brain, 
  Activity, 
  Settings,
  Bell
} from 'lucide-react'
import Tooltip, { StatusTooltip, HelpTooltip, KeyboardTooltip } from './Tooltip'
import { useToast } from './Toast'
import StatusIndicators from './StatusIndicators'

const Header = ({ isConnected, healthData, onToggleAI, onOpenSettings }) => {
  const toast = useToast()


  return (
    <header className="glass-panel m-4 mb-0 p-4 overflow-visible">
      <div className="flex items-center justify-between">
        {/* Left side - App title and status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">ManitoDebug</h1>
          </div>

          {/* Status Indicators */}
          <StatusIndicators healthData={healthData} isConnected={isConnected} />
        </div>

        {/* Right side - Controls and stats */}
        <div className="flex items-center space-x-4">
          {/* Health metrics */}
          {healthData && (
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {healthData.system?.memory && (
                <div className="flex items-center space-x-1">
                  <span>Memory:</span>
                  <span className="text-gray-200">
                    {healthData.system.memory.used}MB
                  </span>
                </div>
              )}
              {healthData.system?.cpu && (
                <div className="flex items-center space-x-1">
                  <span>CPU:</span>
                  <span className="text-gray-200">
                    {healthData.system.cpu.user}ms
                  </span>
                </div>
              )}
              {healthData.services?.database?.pool && (
                <div className="flex items-center space-x-1">
                  <span>DB Pool:</span>
                  <span className="text-gray-200">
                    {healthData.services.database.pool.idleCount} idle
                  </span>
                </div>
              )}
              {healthData.services?.database?.cache && (
                <div className="flex items-center space-x-1">
                  <span>Cache:</span>
                  <span className="text-gray-200">
                    {Math.round(healthData.services.database.cache.hitRate || 0)}%
                  </span>
                </div>
              )}
              {healthData.services?.websocket?.connections && (
                <div className="flex items-center space-x-1">
                  <span>WS:</span>
                  <span className="text-gray-200">
                    {healthData.services.websocket.connections}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* AI Toggle Button */}
          <KeyboardTooltip shortcut="Alt+A" description="Toggle AI Assistant">
            <button
              onClick={onToggleAI}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            >
              <Brain className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>
          </KeyboardTooltip>

          {/* Test Toast Button */}
          <Tooltip content="Test toast notifications">
            <button 
              onClick={() => {
                toast.success('Test success message!', { title: 'Success' })
                setTimeout(() => toast.error('Test error message!', { title: 'Error' }), 1000)
                setTimeout(() => toast.warning('Test warning message!', { title: 'Warning' }), 2000)
                setTimeout(() => toast.info('Test info message!', { title: 'Info' }), 3000)
              }}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            >
              <Bell className="w-5 h-5" />
            </button>
          </Tooltip>

          {/* Settings Button */}
          <KeyboardTooltip shortcut="Cmd+," description="Open Settings">
            <button 
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            >
              <Settings className="w-5 h-5" />
            </button>
          </KeyboardTooltip>
        </div>
      </div>
    </header>
  )
}

export default Header