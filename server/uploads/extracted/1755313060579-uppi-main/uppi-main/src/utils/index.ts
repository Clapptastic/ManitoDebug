/**
 * Utility Functions Index
 * Central export point for all utility functions
 */

// Core utilities
export { cn } from '@/lib/utils';

// Formatting utilities
export {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatPercentage,
  formatNumber,
  formatCurrency,
  formatUptime
} from './formatters';

// Re-export formatting utilities with aliases
export { formatBytes, formatFileSize } from './formatters';

// Error handling utilities
export {
  handleError,
  handleSuccess,
  handleLoading,
  withErrorHandling,
  validateAndHandle,
  handleFileError,
  handleApiError,
  type ErrorContext,
  type ApiError,
  AppError
} from './errorHandling';

// Standard error handler
export { standardErrorHandler } from './errorHandling/standardErrorHandler';

// Security utilities (for production)
export {
  sanitizeErrorForProduction,
  logErrorSecurely,
  isProduction,
  getSafeErrorMessage
} from './errorHandling/security/productionErrorHandler';