/**
 * Legacy API Keys Hook - Redirects to Unified Architecture
 * 
 * This file now redirects to the unified API key architecture.
 * All functionality has been moved to useUnifiedApiKeys.
 * 
 * SINGLE SOURCE OF TRUTH: src/hooks/useUnifiedApiKeys.ts
 */

// Re-export from the unified architecture
export { useUnifiedApiKeys as useApiKeys } from '@/hooks/useUnifiedApiKeys';