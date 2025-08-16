import { useToast } from '../components/Toast'

// User feedback categories and messages
export const FEEDBACK_MESSAGES = {
  SCAN: {
    STARTED: 'Starting code analysis...',
    PROGRESS: (files, stage) => `Analyzing ${files} files (${stage})...`,
    COMPLETED: (files, conflicts) => `Analysis complete! Found ${files} files with ${conflicts} potential conflicts.`,
    FAILED: (error) => `Analysis failed: ${error}`,
    NO_FILES: 'No files found to analyze. Please check your path and file patterns.',
    INVALID_PATH: 'Invalid path provided. Please check the directory path.',
    FILE_TOO_LARGE: (filename) => `File ${filename} is too large to analyze.`,
    UNSUPPORTED_FILE: (filename) => `File ${filename} is not supported for analysis.`
  },
  
  UPLOAD: {
    STARTED: 'Uploading and analyzing project...',
    PROGRESS: (progress) => `Processing... ${progress}%`,
    COMPLETED: (projectName) => `Project "${projectName}" uploaded and analyzed successfully!`,
    FAILED: (error) => `Upload failed: ${error}`,
    INVALID_FILE: 'Invalid file format. Please upload a valid ZIP file.',
    FILE_TOO_LARGE: 'File is too large. Please compress your project or use a smaller directory.',
    NETWORK_ERROR: 'Network error occurred during upload. Please check your connection.'
  },
  
  SETTINGS: {
    SAVED: 'Settings saved successfully!',
    RESET: 'Settings reset to defaults.',
    IMPORTED: 'Settings imported successfully!',
    EXPORTED: 'Settings exported successfully!',
    FAILED: 'Failed to save settings.',
    INVALID_IMPORT: 'Invalid settings file. Please check the file format.'
  },
  
  AI: {
    CONNECTING: 'Connecting to AI service...',
    PROCESSING: 'Processing your request...',
    COMPLETED: 'AI analysis completed!',
    FAILED: (error) => `AI request failed: ${error}`,
    NO_API_KEY: 'No API key configured. Please add your API key in settings.',
    INVALID_API_KEY: 'Invalid API key. Please check your configuration.',
    RATE_LIMITED: 'Rate limit exceeded. Please wait a moment and try again.',
    MODEL_UNAVAILABLE: 'Selected model is currently unavailable. Please try a different model.'
  },
  
  SYSTEM: {
    CONNECTED: 'Connected to server',
    DISCONNECTED: 'Disconnected from server',
    RECONNECTING: 'Reconnecting to server...',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    PERMISSION_DENIED: 'Permission denied. Please check your access rights.'
  },
  
  ACTIONS: {
    COPIED: (item) => `${item} copied to clipboard`,
    DOWNLOADED: (filename) => `${filename} downloaded successfully`,
    DELETED: (item) => `${item} deleted successfully`,
    CREATED: (item) => `${item} created successfully`,
    UPDATED: (item) => `${item} updated successfully`
  },
  
  VALIDATION: {
    REQUIRED_FIELD: (field) => `${field} is required`,
    INVALID_FORMAT: (field) => `${field} format is invalid`,
    TOO_SHORT: (field, min) => `${field} must be at least ${min} characters`,
    TOO_LONG: (field, max) => `${field} must be no more than ${max} characters`,
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_URL: 'Please enter a valid URL',
    PASSWORDS_DONT_MATCH: 'Passwords do not match'
  }
}

// Feedback severity levels
export const FEEDBACK_SEVERITY = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
}

// User feedback utility class
export class UserFeedback {
  constructor(toast) {
    this.toast = toast
  }

  // Scan-related feedback
  scanStarted() {
    return this.toast.loading(FEEDBACK_MESSAGES.SCAN.STARTED, { title: 'Starting Analysis' })
  }

  scanProgress(files, stage) {
    return this.toast.loading(FEEDBACK_MESSAGES.SCAN.PROGRESS(files, stage), { title: 'Analyzing' })
  }

  scanCompleted(files, conflicts) {
    return this.toast.success(FEEDBACK_MESSAGES.SCAN.COMPLETED(files, conflicts), {
      title: 'Analysis Complete',
      duration: 6000,
      actions: [{
        label: 'View Results',
        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
      }]
    })
  }

  scanFailed(error) {
    return this.toast.error(FEEDBACK_MESSAGES.SCAN.FAILED(error), {
      title: 'Analysis Failed',
      duration: 8000
    })
  }

  scanNoFiles() {
    return this.toast.warning(FEEDBACK_MESSAGES.SCAN.NO_FILES, {
      title: 'No Files Found',
      duration: 5000
    })
  }

  scanInvalidPath() {
    return this.toast.error(FEEDBACK_MESSAGES.SCAN.INVALID_PATH, {
      title: 'Invalid Path',
      duration: 5000
    })
  }

  // Upload-related feedback
  uploadStarted() {
    return this.toast.loading(FEEDBACK_MESSAGES.UPLOAD.STARTED, { title: 'Uploading' })
  }

  uploadProgress(progress) {
    return this.toast.loading(FEEDBACK_MESSAGES.UPLOAD.PROGRESS(progress), { title: 'Processing' })
  }

  uploadCompleted(projectName) {
    return this.toast.success(FEEDBACK_MESSAGES.UPLOAD.COMPLETED(projectName), {
      title: 'Upload Complete',
      duration: 6000
    })
  }

  uploadFailed(error) {
    return this.toast.error(FEEDBACK_MESSAGES.UPLOAD.FAILED(error), {
      title: 'Upload Failed',
      duration: 8000
    })
  }

  uploadInvalidFile() {
    return this.toast.error(FEEDBACK_MESSAGES.UPLOAD.INVALID_FILE, {
      title: 'Invalid File',
      duration: 5000
    })
  }

  uploadFileTooLarge() {
    return this.toast.error(FEEDBACK_MESSAGES.UPLOAD.FILE_TOO_LARGE, {
      title: 'File Too Large',
      duration: 6000
    })
  }

  // Settings-related feedback
  settingsSaved() {
    return this.toast.success(FEEDBACK_MESSAGES.SETTINGS.SAVED, {
      title: 'Settings Saved',
      duration: 3000
    })
  }

  settingsReset() {
    return this.toast.info(FEEDBACK_MESSAGES.SETTINGS.RESET, {
      title: 'Settings Reset',
      duration: 3000
    })
  }

  settingsImported() {
    return this.toast.success(FEEDBACK_MESSAGES.SETTINGS.IMPORTED, {
      title: 'Settings Imported',
      duration: 3000
    })
  }

  settingsExported() {
    return this.toast.success(FEEDBACK_MESSAGES.SETTINGS.EXPORTED, {
      title: 'Settings Exported',
      duration: 3000
    })
  }

  settingsFailed() {
    return this.toast.error(FEEDBACK_MESSAGES.SETTINGS.FAILED, {
      title: 'Settings Error',
      duration: 5000
    })
  }

  // AI-related feedback
  aiConnecting() {
    return this.toast.loading(FEEDBACK_MESSAGES.AI.CONNECTING, { title: 'AI Service' })
  }

  aiProcessing() {
    return this.toast.loading(FEEDBACK_MESSAGES.AI.PROCESSING, { title: 'AI Processing' })
  }

  aiCompleted() {
    return this.toast.success(FEEDBACK_MESSAGES.AI.COMPLETED, {
      title: 'AI Complete',
      duration: 3000
    })
  }

  aiFailed(error) {
    return this.toast.error(FEEDBACK_MESSAGES.AI.FAILED(error), {
      title: 'AI Error',
      duration: 8000
    })
  }

  aiNoApiKey() {
    return this.toast.error(FEEDBACK_MESSAGES.AI.NO_API_KEY, {
      title: 'API Key Required',
      duration: 6000,
      actions: [{
        label: 'Open Settings',
        onClick: () => {
          // This would need to be passed from parent component
          window.dispatchEvent(new CustomEvent('openSettings'))
        }
      }]
    })
  }

  aiInvalidApiKey() {
    return this.toast.error(FEEDBACK_MESSAGES.AI.INVALID_API_KEY, {
      title: 'Invalid API Key',
      duration: 6000
    })
  }

  aiRateLimited() {
    return this.toast.warning(FEEDBACK_MESSAGES.AI.RATE_LIMITED, {
      title: 'Rate Limited',
      duration: 6000
    })
  }

  // System-related feedback
  systemConnected() {
    return this.toast.success(FEEDBACK_MESSAGES.SYSTEM.CONNECTED, {
      title: 'Connected',
      duration: 2000
    })
  }

  systemDisconnected() {
    return this.toast.error(FEEDBACK_MESSAGES.SYSTEM.DISCONNECTED, {
      title: 'Disconnected',
      duration: 5000
    })
  }

  systemReconnecting() {
    return this.toast.warning(FEEDBACK_MESSAGES.SYSTEM.RECONNECTING, {
      title: 'Reconnecting',
      duration: 3000
    })
  }

  systemError(error) {
    return this.toast.error(FEEDBACK_MESSAGES.SYSTEM.SERVER_ERROR, {
      title: 'System Error',
      description: error,
      duration: 8000
    })
  }

  networkError() {
    return this.toast.error(FEEDBACK_MESSAGES.SYSTEM.NETWORK_ERROR, {
      title: 'Network Error',
      duration: 6000
    })
  }

  // Action-related feedback
  actionCopied(item = 'Content') {
    return this.toast.success(FEEDBACK_MESSAGES.ACTIONS.COPIED(item), {
      title: 'Copied',
      duration: 2000
    })
  }

  actionDownloaded(filename) {
    return this.toast.success(FEEDBACK_MESSAGES.ACTIONS.DOWNLOADED(filename), {
      title: 'Downloaded',
      duration: 3000
    })
  }

  actionDeleted(item) {
    return this.toast.success(FEEDBACK_MESSAGES.ACTIONS.DELETED(item), {
      title: 'Deleted',
      duration: 3000
    })
  }

  // Validation feedback
  validationError(field, message) {
    return this.toast.error(message || FEEDBACK_MESSAGES.VALIDATION.REQUIRED_FIELD(field), {
      title: 'Validation Error',
      duration: 5000
    })
  }

  validationWarning(field, message) {
    return this.toast.warning(message, {
      title: 'Validation Warning',
      duration: 5000
    })
  }

  // Generic feedback methods
  success(message, title = 'Success', options = {}) {
    return this.toast.success(message, { title, ...options })
  }

  error(message, title = 'Error', options = {}) {
    return this.toast.error(message, { title, duration: 8000, ...options })
  }

  warning(message, title = 'Warning', options = {}) {
    return this.toast.warning(message, { title, ...options })
  }

  info(message, title = 'Info', options = {}) {
    return this.toast.info(message, { title, ...options })
  }

  loading(message, title = 'Loading', options = {}) {
    return this.toast.loading(message, { title, ...options })
  }
}

// React hook for user feedback
export const useUserFeedback = () => {
  const toast = useToast()
  return new UserFeedback(toast)
}

// Error handler with user feedback
export const handleErrorWithFeedback = (error, context, feedback) => {
  console.error(`Error in ${context}:`, error)
  
  let message = 'An unexpected error occurred'
  let title = 'Error'
  
  if (error.message) {
    message = error.message
  }
  
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    message = FEEDBACK_MESSAGES.SYSTEM.NETWORK_ERROR
    title = 'Network Error'
  } else if (error.status === 401) {
    message = 'Authentication required. Please log in again.'
    title = 'Authentication Error'
  } else if (error.status === 403) {
    message = 'You do not have permission to perform this action.'
    title = 'Permission Denied'
  } else if (error.status === 404) {
    message = 'The requested resource was not found.'
    title = 'Not Found'
  } else if (error.status === 429) {
    message = FEEDBACK_MESSAGES.AI.RATE_LIMITED
    title = 'Rate Limited'
  } else if (error.status >= 500) {
    message = FEEDBACK_MESSAGES.SYSTEM.SERVER_ERROR
    title = 'Server Error'
  }
  
  feedback.error(message, title, {
    description: `Error occurred in ${context}`,
    actions: [{
      label: 'Copy Error',
      onClick: () => {
        navigator.clipboard.writeText(`${title}: ${message}\nContext: ${context}\nStack: ${error.stack || 'No stack trace'}`)
        feedback.actionCopied('Error details')
      }
    }]
  })
}

// Success handler with user feedback
export const handleSuccessWithFeedback = (message, context, feedback, options = {}) => {
  console.log(`Success in ${context}:`, message)
  feedback.success(message, 'Success', {
    description: `Operation completed in ${context}`,
    ...options
  })
}
