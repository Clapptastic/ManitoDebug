import React from 'react'
import {
  AlertTriangle,
  X,
  Check,
  Info,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  FileX
} from 'lucide-react'

const dialogTypes = {
  danger: {
    icon: AlertTriangle,
    className: 'border-red-500/30 bg-red-500/10',
    iconColor: 'text-red-400',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    cancelClass: 'btn-secondary'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-500/30 bg-yellow-500/10',
    iconColor: 'text-yellow-400',
    confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    cancelClass: 'btn-secondary'
  },
  info: {
    icon: Info,
    className: 'border-blue-500/30 bg-blue-500/10',
    iconColor: 'text-blue-400',
    confirmClass: 'btn-primary',
    cancelClass: 'btn-secondary'
  },
  destructive: {
    icon: Trash2,
    className: 'border-red-500/30 bg-red-500/10',
    iconColor: 'text-red-400',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    cancelClass: 'btn-secondary'
  }
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  loading = false,
  details = null,
  checkboxText = null,
  showCheckbox = false,
  onCheckboxChange = null,
  checkboxChecked = false
}) {
  const config = dialogTypes[type] || dialogTypes.info
  const Icon = config.icon

  if (!isOpen) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && e.metaKey) {
      onConfirm()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className={`glass-panel w-full max-w-md border ${config.className} animate-scale-up`}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-gray-800/50 ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
            disabled={loading}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-gray-300 leading-relaxed mb-4">{message}</p>
          
          {/* Details */}
          {details && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-400 space-y-1">
                {Array.isArray(details) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                ) : (
                  <div>{details}</div>
                )}
              </div>
            </div>
          )}

          {/* Checkbox */}
          {showCheckbox && checkboxText && (
            <label className="flex items-center space-x-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => onCheckboxChange?.(e.target.checked)}
                className="rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                disabled={loading}
              />
              <span className="text-sm text-gray-300">{checkboxText}</span>
            </label>
          )}

          {/* Warning for destructive actions */}
          {(type === 'danger' || type === 'destructive') && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-300">
                  This action cannot be undone. Please confirm you want to proceed.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 pt-2 border-t border-gray-700/50">
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${config.cancelClass}`}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading || (showCheckbox && !checkboxChecked)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 ${config.confirmClass}`}
          >
            {loading && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="px-6 pb-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Press Esc to cancel</span>
            <span>Press ⌘+Enter to confirm</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Convenience functions for common confirmation dialogs
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState({
    isOpen: false,
    config: {}
  })

  const confirm = (config) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        config: {
          ...config,
          onConfirm: () => {
            setDialogState({ isOpen: false, config: {} })
            resolve(true)
          },
          onClose: () => {
            setDialogState({ isOpen: false, config: {} })
            resolve(false)
          }
        }
      })
    })
  }

  const confirmDelete = (itemName, details = null) => {
    return confirm({
      type: 'destructive',
      title: `Delete ${itemName}?`,
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      details
    })
  }

  const confirmClearData = (dataType = 'data') => {
    return confirm({
      type: 'danger',
      title: `Clear ${dataType}?`,
      message: `This will permanently remove all ${dataType}. Are you sure you want to continue?`,
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      showCheckbox: true,
      checkboxText: 'I understand this action cannot be undone'
    })
  }

  const confirmResetSettings = () => {
    return confirm({
      type: 'warning',
      title: 'Reset Settings?',
      message: 'This will restore all settings to their default values. Your current preferences will be lost.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      details: [
        'All custom preferences will be lost',
        'UI settings will return to defaults',
        'API keys and connections will be cleared'
      ]
    })
  }

  const confirmUnsavedChanges = () => {
    return confirm({
      type: 'warning',
      title: 'Unsaved Changes',
      message: 'You have unsaved changes that will be lost. Do you want to continue without saving?',
      confirmText: 'Discard Changes',
      cancelText: 'Stay Here'
    })
  }

  const Dialog = dialogState.isOpen ? (
    <ConfirmDialog
      isOpen={true}
      {...dialogState.config}
    />
  ) : null

  return {
    confirm,
    confirmDelete,
    confirmClearData, 
    confirmResetSettings,
    confirmUnsavedChanges,
    Dialog
  }
}

export default ConfirmDialog