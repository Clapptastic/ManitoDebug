import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    // General Settings
    theme: 'dark',
    language: 'en',
    autoSave: true,
    confirmActions: true,
    
    // Appearance
    fontSize: 'medium',
    sidebarPosition: 'left',
    compactMode: false,
    showLineNumbers: true,
    colorScheme: 'default',
    
    // Notifications
    enableNotifications: true,
    soundEnabled: true,
    scanCompleteNotify: true,
    errorNotifications: true,
    updateNotifications: true,
    
    // Analysis Settings
    maxFileSize: 1024 * 1024, // 1MB
    scanTimeout: 30000, // 30 seconds
    deepAnalysis: true,
    trackDependencies: true,
    detectCircular: true,
    complexityThreshold: 10,
    
    // Performance
    enableCache: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    preloadResults: true,
    backgroundScanning: false,
    
    // Security
    allowRemoteScanning: false,
    encryptLocalData: true,
    shareAnalytics: false,
    
    // AI Settings
    aiProvider: 'local',
    aiApiKeys: {
      openai: '',
      anthropic: '',
      google: '',
      custom: ''
    },
    enableAIInsights: true,
    aiResponseLength: 'medium',
    aiModelPreferences: {
      openai: 'gpt-3.5-turbo',
      anthropic: 'claude-3-haiku-20240307',
      google: 'gemini-pro'
    }
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('manito-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.warn('Failed to load settings:', error)
    }
  }, [])

  // Apply theme changes
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  // Apply font size changes
  useEffect(() => {
    applyFontSize(settings.fontSize)
  }, [settings.fontSize])

  // Apply color scheme changes
  useEffect(() => {
    applyColorScheme(settings.colorScheme)
  }, [settings.colorScheme])

  // Apply compact mode changes
  useEffect(() => {
    applyCompactMode(settings.compactMode)
  }, [settings.compactMode])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('manito-settings', JSON.stringify(settings))
      setHasChanges(false)
      
      // Show success notification if notifications are enabled
      if (settings.enableNotifications) {
        toast.success('Settings saved successfully!', {
          actions: [{
            label: 'Reload App',
            onClick: () => window.location.reload()
          }]
        })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      if (settings.errorNotifications) {
        toast.error('Failed to save settings')
      }
    }
  }

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      language: 'en',
      autoSave: true,
      confirmActions: true,
      fontSize: 'medium',
      sidebarPosition: 'left',
      compactMode: false,
      showLineNumbers: true,
      colorScheme: 'default',
      enableNotifications: true,
      soundEnabled: true,
      scanCompleteNotify: true,
      errorNotifications: true,
      updateNotifications: true,
      maxFileSize: 1024 * 1024,
      scanTimeout: 30000,
      deepAnalysis: true,
      trackDependencies: true,
      detectCircular: true,
      complexityThreshold: 10,
      enableCache: true,
      maxCacheSize: 100 * 1024 * 1024,
      preloadResults: true,
      backgroundScanning: false,
      allowRemoteScanning: false,
      encryptLocalData: true,
      shareAnalytics: false,
      aiProvider: 'local',
      aiApiKeys: {
        openai: '',
        anthropic: '',
        google: '',
        custom: ''
      },
      enableAIInsights: true,
      aiResponseLength: 'medium',
      aiModelPreferences: {
        openai: 'gpt-3.5-turbo',
        anthropic: 'claude-3-haiku-20240307',
        google: 'gemini-pro'
      }
    }
    
    setSettings(defaultSettings)
    setHasChanges(true)
    
    if (settings.enableNotifications) {
      toast.info('Settings reset to defaults')
    }
  }

  // Theme application
  const applyTheme = (theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#ffffff')
    }
  }

  // Font size application
  const applyFontSize = (fontSize) => {
    const root = document.documentElement
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    }
    root.style.fontSize = sizes[fontSize] || '16px'
  }

  // Color scheme application
  const applyColorScheme = (colorScheme) => {
    const root = document.documentElement
    root.classList.remove('color-scheme-blue', 'color-scheme-green', 'color-scheme-purple', 'color-scheme-red')
    if (colorScheme !== 'default') {
      root.classList.add(`color-scheme-${colorScheme}`)
    }
  }

  // Compact mode application
  const applyCompactMode = (compactMode) => {
    const root = document.documentElement
    if (compactMode) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }
  }

  // Notification helper
  const showNotification = (type, message, options = {}) => {
    if (!settings.enableNotifications) return
    
    switch (type) {
      case 'success':
        toast.success(message, options)
        break
      case 'error':
        if (settings.errorNotifications) {
          toast.error(message, options)
        }
        break
      case 'info':
        toast.info(message, options)
        break
      case 'warning':
        toast.warning(message, options)
        break
    }
  }

  // Confirmation dialog helper
  const confirmAction = (message, onConfirm, onCancel) => {
    if (!settings.confirmActions) {
      onConfirm()
      return
    }
    
    // For now, use browser confirm. Later we can implement a custom modal
    if (window.confirm(message)) {
      onConfirm()
    } else if (onCancel) {
      onCancel()
    }
  }

  // AI API key validation
  const getValidAIProvider = () => {
    const { aiApiKeys, aiProvider } = settings
    
    // Check if the selected provider has a valid API key
    if (aiProvider !== 'local' && aiApiKeys[aiProvider]?.trim()) {
      return aiProvider
    }
    
    // Fallback to first available provider with valid key
    for (const [provider, key] of Object.entries(aiApiKeys)) {
      if (key?.trim()) {
        return provider
      }
    }
    
    return null
  }

  // Get AI API key for a specific provider
  const getAIApiKey = (provider) => {
    return settings.aiApiKeys[provider]?.trim() || null
  }

  // Get AI model preference for a specific provider
  const getAIModel = (provider) => {
    return settings.aiModelPreferences[provider] || null
  }

  const value = {
    settings,
    hasChanges,
    updateSetting,
    updateSettings,
    saveSettings,
    resetSettings,
    showNotification,
    confirmAction,
    getValidAIProvider,
    getAIApiKey,
    getAIModel
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
