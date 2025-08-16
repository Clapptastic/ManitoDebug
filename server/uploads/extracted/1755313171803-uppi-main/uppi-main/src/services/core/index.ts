/**
 * Core Services - Unified Service Layer
 * Single source of truth for all core functionality
 */

// Core Services
import { errorManager } from './ErrorManager';
import { monitoringManager } from './MonitoringManager';
import { dataManager } from './DataManager';
import { unifiedApiKeyService } from '../api-keys/unifiedApiKeyService';
import { authManager } from './AuthManager';
import { cacheManager } from './CacheManager';
import { subscriptionManager } from './SubscriptionManager';
import { teamCollaborationService } from './teamCollaborationService';
import { translationService } from './translationService';
import { userPreferencesService } from './userPreferencesService';
import { customReportsService } from './customReportsService';
import { enterpriseService } from './enterpriseService';
import { businessIntelligenceService } from './businessIntelligenceService';

export { errorManager };
export type { ErrorOperations, TrackedError, ErrorCategory, ErrorSeverity } from './ErrorManager';

export { monitoringManager };
export type { MonitoringOperations, SystemHealthData, ComponentHealthData } from './MonitoringManager';

export { dataManager };
export type { DataOperations, ValidTableName, DataFetchOptions } from './DataManager';

// Competitor Analysis functionality moved to competitorAnalysisService

export { unifiedApiKeyService as apiKeyManager };
export type { ApiKeyOperations } from '@/types/api-keys/unified';

export { authManager };
export type { AuthOperations, AuthState } from './AuthManager';

export { cacheManager };
export type { CacheOptions } from './CacheManager';

export { subscriptionManager };
export type { SubscriptionConfig, ManagedSubscription } from './SubscriptionManager';

export { teamCollaborationService };
export type { 
  Team, 
  TeamMember, 
  TeamInvitation, 
  SharedWorkspace,
  CreateTeamRequest,
  InviteTeamMemberRequest,
  CreateWorkspaceRequest 
} from './teamCollaborationService';

export { translationService };
export { userPreferencesService };
export { customReportsService };

export { enterpriseService };
export type { 
  SSOConfiguration, 
  AuditLog, 
  BillingSubscription, 
  ComplianceReport,
  CreateSSOConfigRequest,
  CreateComplianceReportRequest 
} from './enterpriseService';

export { businessIntelligenceService };
export type { 
  AnalyticsDashboard, 
  DataVisualization, 
  ScheduledExport, 
  BusinessMetric,
  CreateDashboardRequest,
  CreateVisualizationRequest,
  CreateExportRequest 
} from './businessIntelligenceService';

// Re-export for convenience
export const coreServices = {
  error: errorManager,
  monitoring: monitoringManager,
  data: dataManager,
  apiKeys: unifiedApiKeyService,
  auth: authManager,
  cache: cacheManager,
  subscriptions: subscriptionManager,
  teamCollaboration: teamCollaborationService,
  translation: translationService,
  userPreferences: userPreferencesService,
  customReports: customReportsService,
  enterprise: enterpriseService,
  businessIntelligence: businessIntelligenceService
};

export default coreServices;