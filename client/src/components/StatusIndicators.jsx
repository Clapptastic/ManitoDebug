import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  Server, 
  Wifi, 
  WifiOff,
  Activity,
  HardDrive,
  Zap
} from 'lucide-react';
import Tooltip from './Tooltip';

const StatusIndicators = ({ healthData, isConnected }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
      case 'healthy':
      case 'connected':
        return 'text-green-400';
      case 'degraded':
      case 'warning':
        return 'text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
      case 'healthy':
      case 'connected':
        return CheckCircle;
      case 'degraded':
      case 'warning':
        return AlertCircle;
      case 'error':
      case 'disconnected':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatMemory = (bytes) => {
    const mb = Math.round(bytes / 1024 / 1024);
    return `${mb}MB`;
  };

  const formatCacheHitRate = (hitRate) => {
    return `${Math.round(hitRate || 0)}%`;
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Connection Status */}
      <Tooltip 
        content={
          <div className="space-y-2">
            <div className="font-semibold">WebSocket Connection</div>
            <div className="text-sm">
              Status: {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-sm">
              Real-time updates: {isConnected ? 'Active' : 'Inactive'}
            </div>
          </div>
        }
        position="bottom"
      >
        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-700/30 transition-colors cursor-help">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </Tooltip>

      {/* Server Health */}
      {healthData && (
        <Tooltip 
          content={
            <div className="space-y-3">
              <div className="font-semibold">Server Health</div>
              <div className="text-sm">
                Status: {healthData.status || 'Unknown'}
              </div>
              {healthData.uptime && (
                <div className="text-sm">
                  Uptime: {formatUptime(healthData.uptime)}
                </div>
              )}
              {healthData.system?.memory && (
                <div className="text-sm">
                  Memory: {formatMemory(healthData.system.memory.used)} / {formatMemory(healthData.system.memory.total)}
                </div>
              )}
              {healthData.system?.cpu && (
                <div className="text-sm">
                  CPU: {healthData.system.cpu.user}ms user, {healthData.system.cpu.system}ms system
                </div>
              )}
            </div>
          }
          position="bottom"
        >
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-700/30 transition-colors cursor-help">
            <Server className="w-4 h-4 text-gray-400" />
            {React.createElement(getStatusIcon(healthData.status), { 
              className: `w-4 h-4 ${getStatusColor(healthData.status)}` 
            })}
            <span className={`text-sm ${getStatusColor(healthData.status)}`}>
              {healthData.status || 'Unknown'}
            </span>
            {healthData.uptime && (
              <span className="text-xs text-gray-500">
                ({formatUptime(healthData.uptime)})
              </span>
            )}
          </div>
        </Tooltip>
      )}

      {/* Database Status */}
      {healthData?.services?.database && (
        <Tooltip 
          content={
            <div className="space-y-3">
              <div className="font-semibold">Database Status</div>
              <div className="text-sm">
                Status: {healthData.services.database.connected ? 'Connected' : 'Disconnected'}
              </div>
              {healthData.services.database.pool && (
                <div className="text-sm">
                  Connection Pool: {healthData.services.database.pool.idleCount} idle, {healthData.services.database.pool.waitingCount} waiting
                </div>
              )}
              {healthData.services.database.cache && (
                <div className="text-sm">
                  Cache Hit Rate: {formatCacheHitRate(healthData.services.database.cache.hitRate)}
                </div>
              )}
              {healthData.services.database.message && (
                <div className="text-sm text-gray-400">
                  {healthData.services.database.message}
                </div>
              )}
            </div>
          }
          position="bottom"
        >
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-700/30 transition-colors cursor-help">
            <Database className="w-4 h-4 text-gray-400" />
            {React.createElement(getStatusIcon(healthData.services.database.status), { 
              className: `w-4 h-4 ${getStatusColor(healthData.services.database.status)}` 
            })}
            <span className={`text-sm ${getStatusColor(healthData.services.database.status)}`}>
              {healthData.services.database.connected ? 'DB Connected' : 'DB Disconnected'}
            </span>
            {healthData.services.database.pool && (
              <span className="text-xs text-gray-500">
                ({healthData.services.database.pool.idleCount} idle)
              </span>
            )}
          </div>
        </Tooltip>
      )}

      {/* WebSocket Service */}
      {healthData?.services?.websocket && (
        <Tooltip 
          content={
            <div className="space-y-2">
              <div className="font-semibold">WebSocket Service</div>
              <div className="text-sm">
                Status: {healthData.services.websocket.status}
              </div>
              {healthData.services.websocket.connections && (
                <div className="text-sm">
                  Active Connections: {healthData.services.websocket.connections}
                </div>
              )}
            </div>
          }
          position="bottom"
        >
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-700/30 transition-colors cursor-help">
            <Activity className="w-4 h-4 text-gray-400" />
            {React.createElement(getStatusIcon(healthData.services.websocket.status), { 
              className: `w-4 h-4 ${getStatusColor(healthData.services.websocket.status)}` 
            })}
            <span className={`text-sm ${getStatusColor(healthData.services.websocket.status)}`}>
              WS: {healthData.services.websocket.status}
            </span>
            {healthData.services.websocket.connections && (
              <span className="text-xs text-gray-500">
                ({healthData.services.websocket.connections})
              </span>
            )}
          </div>
        </Tooltip>
      )}

      {/* Cache Performance */}
      {healthData?.services?.database?.cache && (
        <Tooltip 
          content={
            <div className="space-y-2">
              <div className="font-semibold">Cache Performance</div>
              <div className="text-sm">
                Hit Rate: {formatCacheHitRate(healthData.services.database.cache.hitRate)}
              </div>
              {healthData.services.database.cache.hits && (
                <div className="text-sm">
                  Hits: {healthData.services.database.cache.hits}
                </div>
              )}
              {healthData.services.database.cache.misses && (
                <div className="text-sm">
                  Misses: {healthData.services.database.cache.misses}
                </div>
              )}
            </div>
          }
          position="bottom"
        >
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-700/30 transition-colors cursor-help">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-200">
              Cache: {formatCacheHitRate(healthData.services.database.cache.hitRate)}
            </span>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default StatusIndicators;
