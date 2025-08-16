import React, { useState } from 'react'
import {
  AlertTriangle,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Brain,
  Zap,
  HelpCircle
} from 'lucide-react'
import { detectMockData, getMockDataMessage, getSetupInstructions } from '../utils/mockDataDetection'

function MockDataAlert({ scanResults, onOpenSettings, onRunScan }) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [showProviders, setShowProviders] = useState(false)

  const detection = detectMockData(scanResults)
  const message = getMockDataMessage(detection)
  const instructions = getSetupInstructions()

  if (!detection.isMockData) {
    return null
  }

  // Only show alert if there are significant mock data issues
  const hasSignificantIssues = detection.indicators.zeroMetrics || 
                              detection.indicators.emptyAIInsights || 
                              detection.indicators.missingData

  if (!hasSignificantIssues) {
    return null
  }

  const handleAction = (action) => {
    switch (action) {
      case 'open-settings':
        onOpenSettings?.()
        break
      case 'run-scan':
        onRunScan?.()
        break
      case 'check-scan':
        // Could open scan configuration or show scan status
        break
      default:
        break
    }
  }

  return (
    <div className="mb-6">
      {/* Main Alert */}
      <div className="glass-panel border border-yellow-500/30 bg-yellow-500/5 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-yellow-200">
                {message.title}
              </h3>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <p className="text-sm text-yellow-100 mb-3">
              {message.message}
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {detection.recommendations.map((rec, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(rec.action)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    rec.priority === 'high'
                      ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/30'
                      : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600/70 border border-gray-600/50'
                  }`}
                >
                  {rec.title}
                </button>
              ))}
            </div>

            {/* Instructions Toggle */}
            {showInstructions && (
              <div className="border-t border-yellow-500/20 pt-4 mt-4">
                <div className="space-y-4">
                  {/* Setup Steps */}
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-200 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      {instructions.title}
                    </h4>
                    
                    <div className="space-y-3">
                      {instructions.steps.map((step) => (
                        <div key={step.step} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 text-yellow-200 rounded-full flex items-center justify-center text-xs font-semibold">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-yellow-100">
                                {step.title}
                              </span>
                              <span className="text-lg">{step.icon}</span>
                            </div>
                            <p className="text-xs text-yellow-200/80 mb-2">
                              {step.description}
                            </p>
                            <button
                              onClick={() => handleAction(step.action)}
                              className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                            >
                              {step.action === 'open-settings' && 'Open Settings'}
                              {step.action === 'run-scan' && 'Start Scan'}
                              {step.action === 'save-settings' && 'Save Settings'}
                              {step.action === 'select-provider' && 'Select Provider'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Providers */}
                  <div>
                    <button
                      onClick={() => setShowProviders(!showProviders)}
                      className="flex items-center space-x-2 text-sm font-medium text-yellow-200 hover:text-yellow-100 transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Available AI Providers</span>
                      {showProviders ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {showProviders && (
                      <div className="mt-3 space-y-2">
                        {instructions.providers.map((provider, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-md">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{provider.icon}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-200">
                                  {provider.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {provider.description}
                                </div>
                              </div>
                            </div>
                            <a
                              href={provider.setupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                            >
                              <span>Setup</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Help Section */}
                  <div className="border-t border-yellow-500/20 pt-3">
                    <div className="flex items-center space-x-2 text-xs text-yellow-200/80">
                      <HelpCircle className="w-3 h-3" />
                      <span>
                        Need help? Check the{' '}
                        <a 
                          href="#documentation" 
                          className="text-yellow-400 hover:text-yellow-300 underline"
                        >
                          documentation
                        </a>{' '}
                        or contact support.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MockDataAlert
