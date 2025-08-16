import { useState, useEffect } from 'react';
import { 
  enterpriseService, 
  SSOConfiguration, 
  AuditLog, 
  BillingSubscription, 
  ComplianceReport,
  CreateSSOConfigRequest,
  CreateComplianceReportRequest
} from '@/services/core/enterpriseService';
import { toast } from 'sonner';

interface UseEnterpriseReturn {
  // SSO
  ssoConfigurations: SSOConfiguration[];
  createSSOConfig: (config: CreateSSOConfigRequest) => Promise<SSOConfiguration | null>;
  updateSSOConfig: (id: string, updates: Partial<CreateSSOConfigRequest>) => Promise<boolean>;
  deleteSSOConfig: (id: string) => Promise<boolean>;
  
  // Audit Logs
  auditLogs: AuditLog[];
  loadAuditLogs: (userId?: string) => Promise<void>;
  
  // Billing
  userSubscription: BillingSubscription | null;
  allSubscriptions: BillingSubscription[];
  loadSubscriptionData: () => Promise<void>;
  
  // Compliance
  complianceReports: ComplianceReport[];
  generateReport: (reportData: CreateComplianceReportRequest) => Promise<ComplianceReport | null>;
  
  // Analytics
  enterpriseAnalytics: Record<string, any>;
  loadAnalytics: (organizationId?: string, period?: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  refreshAll: () => Promise<void>;
}

export function useEnterprise(organizationId?: string): UseEnterpriseReturn {
  const [ssoConfigurations, setSSOConfigurations] = useState<SSOConfiguration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userSubscription, setUserSubscription] = useState<BillingSubscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<BillingSubscription[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [enterpriseAnalytics, setEnterpriseAnalytics] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [organizationId]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadSSOConfigurations(),
        loadAuditLogs(),
        loadSubscriptionData(),
        loadComplianceReports(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading enterprise data:', error);
      toast.error('Failed to load enterprise data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSSOConfigurations = async () => {
    try {
      const configs = await enterpriseService.getSSOConfigurations(organizationId);
      setSSOConfigurations(configs);
    } catch (error) {
      console.error('Error loading SSO configurations:', error);
    }
  };

  const loadAuditLogs = async (userId?: string) => {
    try {
      const logs = await enterpriseService.getAuditLogs(userId);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const [userSub, allSubs] = await Promise.all([
        enterpriseService.getUserSubscription(),
        enterpriseService.getAllSubscriptions()
      ]);
      setUserSubscription(userSub);
      setAllSubscriptions(allSubs);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const loadComplianceReports = async () => {
    try {
      const reports = await enterpriseService.getComplianceReports(organizationId);
      setComplianceReports(reports);
    } catch (error) {
      console.error('Error loading compliance reports:', error);
    }
  };

  const loadAnalytics = async (orgId?: string, period: string = '30d') => {
    try {
      const analytics = await enterpriseService.getEnterpriseAnalytics(orgId || organizationId, period);
      setEnterpriseAnalytics(analytics);
    } catch (error) {
      console.error('Error loading enterprise analytics:', error);
    }
  };

  const createSSOConfig = async (config: CreateSSOConfigRequest): Promise<SSOConfiguration | null> => {
    try {
      const newConfig = await enterpriseService.createSSOConfiguration(config);
      if (newConfig) {
        setSSOConfigurations(prev => [newConfig, ...prev]);
        toast.success('SSO configuration created successfully');
      }
      return newConfig;
    } catch (error) {
      console.error('Error creating SSO configuration:', error);
      toast.error('Failed to create SSO configuration');
      return null;
    }
  };

  const updateSSOConfig = async (id: string, updates: Partial<CreateSSOConfigRequest>): Promise<boolean> => {
    try {
      const success = await enterpriseService.updateSSOConfiguration(id, updates);
      if (success) {
        setSSOConfigurations(prev => prev.map(config => 
          config.id === id ? { ...config, ...updates } : config
        ));
        toast.success('SSO configuration updated successfully');
      }
      return success;
    } catch (error) {
      console.error('Error updating SSO configuration:', error);
      toast.error('Failed to update SSO configuration');
      return false;
    }
  };

  const deleteSSOConfig = async (id: string): Promise<boolean> => {
    try {
      const success = await enterpriseService.deleteSSOConfiguration(id);
      if (success) {
        setSSOConfigurations(prev => prev.filter(config => config.id !== id));
        toast.success('SSO configuration deleted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error deleting SSO configuration:', error);
      toast.error('Failed to delete SSO configuration');
      return false;
    }
  };

  const generateReport = async (reportData: CreateComplianceReportRequest): Promise<ComplianceReport | null> => {
    try {
      const newReport = await enterpriseService.generateComplianceReport(reportData);
      if (newReport) {
        setComplianceReports(prev => [newReport, ...prev]);
        toast.success('Compliance report generated successfully');
      }
      return newReport;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast.error('Failed to generate compliance report');
      return null;
    }
  };

  const refreshAll = async () => {
    await loadAllData();
  };

  return {
    ssoConfigurations,
    createSSOConfig,
    updateSSOConfig,
    deleteSSOConfig,
    auditLogs,
    loadAuditLogs,
    userSubscription,
    allSubscriptions,
    loadSubscriptionData,
    complianceReports,
    generateReport,
    enterpriseAnalytics,
    loadAnalytics,
    isLoading,
    refreshAll
  };
}

// Specific hook for audit logging
export function useAuditLogger() {
  const logAction = async (action: string, resourceType: string, resourceId?: string, changes?: { old?: any; new?: any }) => {
    try {
      await enterpriseService.createAuditLog({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: changes?.old,
        new_values: changes?.new
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  return { logAction };
}