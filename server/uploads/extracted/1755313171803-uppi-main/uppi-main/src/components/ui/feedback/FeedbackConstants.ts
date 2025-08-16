/**
 * Unified Feedback Constants
 * Consistent messaging across the API key system
 */

export const FEEDBACK_MESSAGES = {
  // Success Messages
  SUCCESS: {
    API_KEY_SAVED: (provider: string) => ({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connected`,
      description: '✅ API key encrypted and ready for use.'
    }),
    API_KEY_DELETED: {
      title: 'Key Removed',
      description: '✅ API key securely deleted from encrypted storage.'
    },
    VALIDATION_SUCCESS: (provider: string) => ({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Validated`, 
      description: '✅ API key is working and ready for analysis.'
    }),
    ALL_KEYS_VALID: (count: number) => ({
      title: '✅ All Keys Validated',
      description: `${count} API key${count > 1 ? 's are' : ' is'} active and working correctly.`
    })
  },

  // Error Messages
  ERROR: {
    NO_API_KEY: (provider: string) => ({
      title: 'No API Key Found',
      description: `${provider} API key is not configured. Add your API key using the "Manage Keys" tab.`
    }),
    INVALID_FORMAT: (provider: string, error: string) => ({
      title: `Invalid ${provider} API Key`,
      description: `${error}. Please check the format and try again.`
    }),
    VALIDATION_FAILED: (provider: string, error?: string) => ({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Validation Failed`,
      description: `❌ ${error || 'API key is invalid or service is unreachable. Please verify your key in the provider dashboard.'}`
    }),
    NETWORK_ERROR: {
      title: 'Network Error',
      description: 'Unable to connect to API key service. Please check your connection and try again.'
    },
    SERVICE_UNAVAILABLE: {
      title: 'Service Temporarily Unavailable',
      description: 'API key service is temporarily unavailable. Your data is secure and we\'ll retry automatically.'
    }
  },

  // Warning Messages
  WARNING: {
    NO_KEYS_CONFIGURED: {
      title: 'No API Keys Configured',
      description: 'Add API keys using the "Manage Keys" tab before testing.'
    },
    MIXED_RESULTS: (success: number, failed: number) => ({
      title: '⚠️ Mixed Validation Results',
      description: `${success} working, ${failed} failed. Check individual key statuses above.`
    }),
    SOME_KEYS_INVALID: {
      title: '⚠️ Action Required',
      description: 'API keys configured but not working. Check the "Manage Keys" tab to validate your keys and resolve any issues.'
    }
  },

  // Info Messages  
  INFO: {
    GETTING_STARTED: {
      title: '🚀 Ready to get started?',
      description: 'Add your first API key using the "Manage Keys" tab to unlock AI-powered features.'
    },
    ADD_FIRST_KEY: {
      title: 'No API Keys Configured',
      description: 'Add your first API key using the "Manage Keys" tab to unlock AI-powered analysis features.'
    }
  }
} as const;

export const STATUS_BADGES = {
  ACTIVE: '✅ Active',
  ERROR: '❌ Error', 
  TESTING: '⏳ Testing',
  NOT_SET: 'Not Set'
} as const;

export const LOADING_MESSAGES = {
  VALIDATING: 'Validating...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
  LOADING: 'Loading...'
} as const;