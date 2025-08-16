import React from 'react'
import {
  Loader2,
  Zap,
  Brain,
  Search,
  BarChart3,
  FileText,
  GitBranch,
  Code
} from 'lucide-react'

// Basic loading spinner
export function Spinner({ size = 'md', className = '', color = 'text-primary-500' }) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <Loader2 className={`animate-spin ${sizes[size]} ${color} ${className}`} />
  )
}

// Loading with text
export function LoadingText({ 
  text = 'Loading...', 
  size = 'md',
  className = '',
  showSpinner = true
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showSpinner && <Spinner size={size} />}
      <span className="text-gray-300 animate-pulse">{text}</span>
    </div>
  )
}

// Progress bar
export function ProgressBar({ 
  progress = 0, 
  showPercentage = true,
  className = '',
  size = 'md',
  color = 'bg-primary-500',
  label = null
}) {
  const heights = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-400">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-700/50 rounded-full ${heights[size]} overflow-hidden`}>
        <div 
          className={`${color} ${heights[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

// Skeleton loader
export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    button: 'h-10 rounded-lg',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-32 rounded-lg',
    line: 'h-px w-full'
  }

  return (
    <div className={`
      bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50 
      animate-pulse bg-size-200 animate-shimmer
      ${variants[variant]} ${className}
    `} />
  )
}

// Context-aware loading states
export function ScanningLoader({ stage = 'Initializing', progress = 0, files = 0 }) {
  const stages = {
    'initializing': { icon: Zap, text: 'Initializing scanner...', color: 'text-blue-400' },
    'finding-files': { icon: Search, text: 'Finding files to analyze...', color: 'text-yellow-400' },
    'parsing': { icon: Code, text: 'Parsing source code...', color: 'text-green-400' },
    'analyzing': { icon: Brain, text: 'Analyzing dependencies...', color: 'text-purple-400' },
    'detecting-conflicts': { icon: GitBranch, text: 'Detecting conflicts...', color: 'text-orange-400' },
    'generating-report': { icon: BarChart3, text: 'Generating report...', color: 'text-pink-400' },
    'finalizing': { icon: FileText, text: 'Finalizing results...', color: 'text-cyan-400' }
  }

  const currentStage = stages[stage.toLowerCase()] || stages.initializing
  const Icon = currentStage.icon

  return (
    <div className="glass-panel p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-700/50 border-t-primary-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={`w-6 h-6 ${currentStage.color}`} />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Scanning Code...</h3>
        <p className={`text-sm ${currentStage.color} mb-4`}>{currentStage.text}</p>
        
        {progress > 0 && (
          <ProgressBar 
            progress={progress} 
            label="Overall Progress"
            className="mb-4"
          />
        )}
        
        {files > 0 && (
          <div className="text-xs text-gray-400">
            {files} files processed
          </div>
        )}
      </div>
    </div>
  )
}

// Loading overlay
export function LoadingOverlay({ 
  isVisible = false, 
  message = 'Loading...', 
  progress = null,
  onCancel = null
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="glass-panel p-8 text-center space-y-4 max-w-sm w-full mx-4">
        <div className="flex justify-center">
          <Spinner size="xl" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Please Wait</h3>
          <p className="text-sm text-gray-300 mb-4">{message}</p>
          
          {progress !== null && (
            <ProgressBar 
              progress={progress} 
              showPercentage={true}
              className="mb-4"
            />
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Page loading
export function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-800 border-t-primary-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary-400" />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">ManitoDebug</h2>
          <p className="text-gray-400">Loading your code analysis platform...</p>
        </div>

        <div className="flex justify-center space-x-1 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Button loading state
export function LoadingButton({ 
  isLoading = false, 
  children, 
  loadingText = 'Loading...', 
  className = '',
  disabled = false,
  ...props 
}) {
  return (
    <button 
      className={`flex items-center space-x-2 ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      <span>{isLoading ? loadingText : children}</span>
    </button>
  )
}

// Dots loading animation
export function DotsLoader({ size = 'md', color = 'bg-gray-400' }) {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2', 
    lg: 'w-3 h-3'
  }

  return (
    <div className="flex items-center space-x-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`${sizes[size]} ${color} rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

export default {
  Spinner,
  LoadingText,
  ProgressBar,
  Skeleton,
  ScanningLoader,
  LoadingOverlay,
  PageLoader,
  LoadingButton,
  DotsLoader
}