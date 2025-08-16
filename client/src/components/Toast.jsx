import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Copy,
  Download,
  Upload,
  Zap,
  Minimize2,
  Maximize2
} from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastTypes = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-500/10 border-green-500/30 text-green-400',
    iconColor: 'text-green-400'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-500/10 border-red-500/30 text-red-400',
    iconColor: 'text-red-400'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    iconColor: 'text-yellow-400'
  },
  info: {
    icon: Info,
    className: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    iconColor: 'text-blue-400'
  },
  loading: {
    icon: Zap,
    className: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    iconColor: 'text-purple-400'
  }
}

function Toast({ toast, onClose, onMinimize }) {
  const config = toastTypes[toast.type] || toastTypes.info
  const Icon = config.icon
  const [isMinimized, setIsMinimized] = useState(toast.minimized || false)

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
    onMinimize?.(toast.id, !isMinimized)
  }

  return (
    <div className={`
      glass-panel border rounded-lg shadow-2xl animate-slide-up
      transition-all duration-300 hover:shadow-2xl backdrop-blur-sm
      ${config.className}
      ${isMinimized ? 'p-2' : 'p-4'}
    `}>
      <div className="flex items-start justify-between">
        <div className={`flex items-start space-x-3 ${isMinimized ? 'flex-1' : ''}`}>
          <div className={`p-1 rounded-lg bg-gray-800/50 ${toast.type === 'loading' ? 'animate-pulse' : ''}`}>
            <Icon className={`w-5 h-5 ${config.iconColor} ${toast.type === 'loading' ? 'animate-spin' : ''}`} />
          </div>
          
          {!isMinimized && (
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold text-white mb-1">
                  {toast.title}
                </h4>
              )}
              <p className="text-sm leading-relaxed">
                {toast.message}
              </p>
              
              {/* Action Buttons */}
              {toast.actions && (
                <div className="mt-3 flex items-center space-x-2">
                  {toast.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick?.()
                        if (action.closeOnClick !== false) {
                          onClose()
                        }
                      }}
                      className="btn-ghost btn-sm text-xs"
                    >
                      {action.icon && <action.icon className="w-3 h-3 mr-1" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Progress bar for loading */}
              {toast.type === 'loading' && toast.progress !== undefined && (
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, toast.progress))}%` }}
                  />
                </div>
              )}
            </div>
          )}
          
          {isMinimized && (
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-300 truncate">
                {toast.title || toast.message}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 ml-2">
          {/* Minimize/Maximize Button */}
          <button
            onClick={handleMinimize}
            className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors group"
            title={isMinimized ? "Expand notification" : "Minimize notification"}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
            )}
          </button>
          
          {/* Close Button */}
          {!toast.persistent && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors group"
              title="Close notification"
            >
              <X className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info',
      duration: toast.type === 'loading' ? null : 5000,
      ...toast
    }

    setToasts(prev => [...prev, newToast])

    // Auto-dismiss after duration (unless it's persistent or loading)
    if (newToast.duration && !newToast.persistent && newToast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ))
  }, [])

  const minimizeToast = useCallback((id, minimized) => {
    updateToast(id, { minimized })
  }, [updateToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const toast = {
    success: (message, options = {}) => addToast({ 
      type: 'success', 
      message, 
      title: options.title || 'Success',
      ...options 
    }),
    
    error: (message, options = {}) => addToast({ 
      type: 'error', 
      message, 
      title: options.title || 'Error',
      duration: 8000,
      ...options 
    }),
    
    warning: (message, options = {}) => addToast({ 
      type: 'warning', 
      message, 
      title: options.title || 'Warning',
      ...options 
    }),
    
    info: (message, options = {}) => addToast({ 
      type: 'info', 
      message, 
      title: options.title || 'Info',
      ...options 
    }),

    loading: (message, options = {}) => addToast({ 
      type: 'loading', 
      message, 
      title: options.title || 'Loading',
      persistent: true,
      ...options 
    }),

    // Action-specific toasts
    copied: (item = 'Content') => addToast({
      type: 'success',
      title: 'Copied!',
      message: `${item} copied to clipboard`,
      duration: 2000,
      actions: [{
        icon: Copy,
        label: 'Copy Again',
        onClick: () => navigator.clipboard.writeText(''),
        closeOnClick: false
      }]
    }),

    downloaded: (filename) => addToast({
      type: 'success',
      title: 'Download Started',
      message: filename ? `${filename} is downloading` : 'File download started',
      actions: [{
        icon: Download,
        label: 'View Downloads',
        onClick: () => window.open('chrome://downloads/', '_blank')
      }]
    }),

    uploaded: (filename) => addToast({
      type: 'success',
      title: 'Upload Complete',
      message: filename ? `${filename} uploaded successfully` : 'File uploaded successfully',
      actions: [{
        icon: Upload,
        label: 'View File',
        onClick: () => {}
      }]
    }),

    scanComplete: (results) => addToast({
      type: 'success',
      title: 'Scan Complete!',
      message: `Analyzed ${results.files} files, found ${results.conflicts} issues`,
      actions: [{
        label: 'View Results',
        onClick: () => {}
      }, {
        label: 'Export Report',
        onClick: () => {},
        icon: Download
      }]
    })
  }

  const contextValue = {
    toast,
    addToast,
    removeToast,
    updateToast,
    minimizeToast,
    clearAll,
    toasts
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
              onMinimize={minimizeToast}
            />
          ))}
        </div>
        
        {/* Clear All Button */}
        {toasts.length > 1 && (
          <div className="mt-2 text-center pointer-events-auto">
            <button
              onClick={clearAll}
              className="btn-ghost btn-sm text-xs text-gray-400 hover:text-gray-200"
            >
              Clear All ({toasts.length})
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export default Toast