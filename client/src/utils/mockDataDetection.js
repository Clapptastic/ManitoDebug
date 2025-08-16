// Mock Data Detection and User Feedback System

/**
 * Detects if the current analysis results contain mock data
 * @param {Object} scanResults - The scan results to analyze
 * @returns {Object} - Detection results with flags and recommendations
 */
export const detectMockData = (scanResults) => {
  if (!scanResults) {
    return {
      isMockData: false,
      reason: 'No scan results available',
      recommendations: []
    }
  }

  const indicators = {
    zeroMetrics: false,
    emptyAIInsights: false,
    noRealAnalysis: false,
    missingData: false
  }

  // Check for zero or missing metrics
  if (scanResults.qualityMetrics) {
    const qualityMetrics = scanResults.qualityMetrics
    if (qualityMetrics.complexity?.average === 0 && 
        qualityMetrics.complexity?.max === 0 &&
        qualityMetrics.maintainability?.score === 0) {
      indicators.zeroMetrics = true
    }
  }

  // Check for empty AI insights
  if (scanResults.rawAIAnalysis?.aiInsights) {
    const aiInsights = scanResults.rawAIAnalysis.aiInsights
    if (!aiInsights.qualityMetrics || 
        !aiInsights.recommendations || 
        !aiInsights.architecture) {
      indicators.emptyAIInsights = true
    }
  }

  // Check for missing real analysis data
  if (!scanResults.files || scanResults.files.length === 0) {
    indicators.missingData = true
  }

  // Check if all complexity values are zero
  if (scanResults.files && scanResults.files.length > 0) {
    const allZeroComplexity = scanResults.files.every(file => 
      file.complexity === 0 || file.complexity === undefined
    )
    if (allZeroComplexity) {
      indicators.noRealAnalysis = true
    }
  }

  const isMockData = Object.values(indicators).some(Boolean)

  return {
    isMockData,
    indicators,
    reason: getMockDataReason(indicators),
    recommendations: getRecommendations(indicators)
  }
}

/**
 * Get the reason why mock data is being shown
 */
const getMockDataReason = (indicators) => {
  if (indicators.zeroMetrics && indicators.emptyAIInsights) {
    return 'AI analysis is not properly configured or API keys are missing'
  }
  if (indicators.zeroMetrics) {
    return 'Quality metrics are showing zero values - AI analysis may not be working'
  }
  if (indicators.emptyAIInsights) {
    return 'AI insights are empty - check your AI provider configuration'
  }
  if (indicators.noRealAnalysis) {
    return 'Analysis results show no complexity data - scanning may not be working properly'
  }
  if (indicators.missingData) {
    return 'No scan data available - please run a scan first'
  }
  return 'Unknown issue with analysis data'
}

/**
 * Get recommendations for fixing mock data issues
 */
const getRecommendations = (indicators) => {
  const recommendations = []

  if (indicators.zeroMetrics || indicators.emptyAIInsights) {
    recommendations.push({
      type: 'ai-configuration',
      title: 'Configure AI Provider',
      description: 'Set up your AI API keys to get real analysis insights',
      action: 'open-settings',
      priority: 'high'
    })
  }

  if (indicators.noRealAnalysis) {
    recommendations.push({
      type: 'scan-issue',
      title: 'Check Scan Configuration',
      description: 'Verify that your scan is properly configured and running',
      action: 'check-scan',
      priority: 'medium'
    })
  }

  if (indicators.missingData) {
    recommendations.push({
      type: 'no-data',
      title: 'Run a Scan',
      description: 'Start by analyzing your codebase to get real data',
      action: 'run-scan',
      priority: 'high'
    })
  }

  return recommendations
}

/**
 * Get user-friendly message for mock data detection
 */
export const getMockDataMessage = (detection) => {
  if (!detection.isMockData) {
    return null
  }

  return {
    title: 'Mock Data Detected',
    message: `You're currently viewing mock data. ${detection.reason}`,
    type: 'warning',
    showInstructions: true
  }
}

/**
 * Get setup instructions for the user
 */
export const getSetupInstructions = () => {
  return {
    title: 'How to Set Up Real AI Analysis',
    steps: [
      {
        step: 1,
        title: 'Configure AI Provider',
        description: 'Go to Settings (gear icon) and enter your AI API key',
        action: 'open-settings',
        icon: '⚙️'
      },
      {
        step: 2,
        title: 'Choose Your Provider',
        description: 'Select from OpenAI, Anthropic, Google Gemini, or Custom API',
        action: 'select-provider',
        icon: '🤖'
      },
      {
        step: 3,
        title: 'Save Settings',
        description: 'Click "Save Settings" to persist your configuration',
        action: 'save-settings',
        icon: '💾'
      },
      {
        step: 4,
        title: 'Run Analysis',
        description: 'Start a new scan to get real AI-powered insights',
        action: 'run-scan',
        icon: '🔍'
      }
    ],
    providers: [
      {
        name: 'OpenAI GPT',
        description: 'Powerful language model for code analysis',
        setupUrl: 'https://platform.openai.com/api-keys',
        icon: '🤖'
      },
      {
        name: 'Anthropic Claude',
        description: 'Advanced AI assistant for technical analysis',
        setupUrl: 'https://console.anthropic.com/',
        icon: '🧠'
      },
      {
        name: 'Google Gemini',
        description: 'Google\'s AI model for code understanding',
        setupUrl: 'https://makersuite.google.com/app/apikey',
        icon: '🔍'
      }
    ]
  }
}
