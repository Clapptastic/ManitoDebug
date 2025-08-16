/**
 * Utility to fix all broken imports systematically
 * This maps old import paths to new unified paths
 */

export const importMappings = {
  // API Key type imports
  "'@/types/api-keys/types'": "'@/types/api-keys/unified'",
  "'@/types/api-keys/types-core'": "'@/types/api-keys/unified'", 
  "'@/types/api-keys/enums'": "'@/types/api-keys/unified'",
  
  // Service imports
  "'@/services/apiKeyService'": "'@/services/apiKeys'",
  "'./apiKeyService'": "'@/services/apiKeys'",
  
  // Legacy exports to fix
  "ApiKeyTypeEnum": "ApiKeyTypeEnum",
  "ApiKeyStatusEnum": "ApiKeyStatusEnum",
  "ApiKey": "ApiKey",
  "ApiKeyType": "ApiKeyType",
  "ApiStatusInfo": "ApiStatusInfo",
  "ApiKeyOperations": "ApiKeyOperations"
};

export const filesToUpdate = [
  'src/components/admin/api-management/ApiKeyManagementTable.tsx',
  'src/components/admin/api-management/ApiKeysOverviewPanel.tsx', 
  'src/components/admin/api-management/ApiUsageStatsPanel.tsx',
  'src/components/api-keys/ApiKeyAlert.tsx',
  'src/components/api-keys/ApiKeyStatus.tsx',
  'src/components/api-keys/ApiToggleItem.tsx',
  'src/components/settings/api-key/status/ApiKeyStatusProps.ts',
  'src/components/status/ApiStatusIndicator.tsx',
  'src/hooks/realtime/useRealtimeApiKeys.ts',
  'src/hooks/useApiKeyAvailability.ts',
  'src/hooks/useApiKeyModelManagement.ts',
  'src/hooks/useApiKeyOperations.ts',
  'src/hooks/useApiManagement.ts',
  'src/hooks/useApiStatus.ts',
  'src/hooks/useApiStatuses.ts',
  'src/hooks/useApiValidation.ts',
  'src/hooks/useMicroservices.ts',
  'src/hooks/useModelListState.ts',
  'src/services/api-keys/ApiKeyModelManagementService.ts',
  'src/services/api-keys/apiKeyManagementService.ts',
  'src/services/api/apiOrchestrator.ts',
  'src/services/api/centralizedApiManager.ts'
];