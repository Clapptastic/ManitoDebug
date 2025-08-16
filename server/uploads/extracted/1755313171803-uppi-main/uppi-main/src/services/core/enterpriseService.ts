import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface SSOConfiguration {
  id: string;
  organization_id?: string;
  provider: string;
  provider_config: Json;
  metadata: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values: Json;
  new_values: Json;
  ip_address?: unknown;
  user_agent?: string;
  session_id?: string;
  metadata: Json;
  created_at: string;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  cancel_at?: string;
  canceled_at?: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface ComplianceReport {
  id: string;
  organization_id?: string;
  report_type: string;
  report_data: Json;
  generated_by: string;
  period_start: string;
  period_end: string;
  status: string;
  file_url?: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateSSOConfigRequest {
  organization_id?: string;
  provider: string;
  provider_config: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateAuditLogRequest {
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateComplianceReportRequest {
  organization_id?: string;
  report_type: string;
  period_start: string;
  period_end: string;
  report_data: Record<string, any>;
}

export class EnterpriseService {
  /**
   * SSO Configuration Management
   */
  async getSSOConfigurations(organizationId?: string): Promise<SSOConfiguration[]> {
    try {
      let query = supabase.from('sso_configurations').select('*');
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching SSO configurations:', error);
      return [];
    }
  }

  async createSSOConfiguration(configData: CreateSSOConfigRequest): Promise<SSOConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from('sso_configurations')
        .insert({
          organization_id: configData.organization_id,
          provider: configData.provider,
          provider_config: configData.provider_config,
          metadata: configData.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating SSO configuration:', error);
      return null;
    }
  }

  async updateSSOConfiguration(id: string, updates: Partial<CreateSSOConfigRequest>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sso_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating SSO configuration:', error);
      return false;
    }
  }

  async deleteSSOConfiguration(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sso_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting SSO configuration:', error);
      return false;
    }
  }

  /**
   * Audit Logging
   */
  async getAuditLogs(userId?: string, limit: number = 100): Promise<AuditLog[]> {
    try {
      let query = supabase.from('audit_logs').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async createAuditLog(logData: CreateAuditLogRequest): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action: logData.action,
          resource_type: logData.resource_type,
          resource_id: logData.resource_id,
          old_values: logData.old_values || {},
          new_values: logData.new_values || {},
          metadata: logData.metadata || {}
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return false;
    }
  }

  /**
   * Billing Subscription Management
   */
  async getUserSubscription(userId?: string): Promise<BillingSubscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  async getAllSubscriptions(): Promise<BillingSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all subscriptions:', error);
      return [];
    }
  }

  /**
   * Compliance Reporting
   */
  async getComplianceReports(organizationId?: string): Promise<ComplianceReport[]> {
    try {
      let query = supabase.from('compliance_reports').select('*');
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching compliance reports:', error);
      return [];
    }
  }

  async generateComplianceReport(reportData: CreateComplianceReportRequest): Promise<ComplianceReport | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert({
          organization_id: reportData.organization_id,
          report_type: reportData.report_type,
          report_data: reportData.report_data,
          generated_by: user.id,
          period_start: reportData.period_start,
          period_end: reportData.period_end,
          status: 'generated'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return null;
    }
  }

  /**
   * Advanced Analytics for Enterprise
   */
  async getEnterpriseAnalytics(organizationId?: string, period: string = '30d'): Promise<Record<string, any>> {
    try {
      // This would typically call multiple endpoints or complex queries
      const [userActivity, subscriptionMetrics, complianceStatus] = await Promise.all([
        this.getUserActivityMetrics(organizationId, period),
        this.getSubscriptionMetrics(organizationId),
        this.getComplianceStatus(organizationId)
      ]);

      return {
        userActivity,
        subscriptionMetrics,
        complianceStatus,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching enterprise analytics:', error);
      return {};
    }
  }

  private async getUserActivityMetrics(organizationId?: string, period: string = '30d'): Promise<Record<string, any>> {
    // Simplified analytics - in real implementation would use complex queries
    const daysAgo = period === '30d' ? 30 : period === '7d' ? 7 : 1;
    const fromDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .gte('created_at', fromDate);

      if (error) throw error;

      const actionCounts = (data || []).reduce((acc: Record<string, number>, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      return {
        totalActions: data?.length || 0,
        actionBreakdown: actionCounts,
        period
      };
    } catch (error) {
      console.error('Error fetching user activity metrics:', error);
      return {};
    }
  }

  private async getSubscriptionMetrics(organizationId?: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('status, plan_name');

      if (error) throw error;

      const statusCounts = (data || []).reduce((acc: Record<string, number>, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {});

      const planCounts = (data || []).reduce((acc: Record<string, number>, sub) => {
        acc[sub.plan_name] = (acc[sub.plan_name] || 0) + 1;
        return acc;
      }, {});

      return {
        totalSubscriptions: data?.length || 0,
        statusBreakdown: statusCounts,
        planBreakdown: planCounts
      };
    } catch (error) {
      console.error('Error fetching subscription metrics:', error);
      return {};
    }
  }

  private async getComplianceStatus(organizationId?: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('compliance_reports')
        .select('report_type, status, created_at')
        .gte('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString());

      if (error) throw error;

      const reportCounts = (data || []).reduce((acc: Record<string, number>, report) => {
        acc[report.report_type] = (acc[report.report_type] || 0) + 1;
        return acc;
      }, {});

      return {
        recentReports: data?.length || 0,
        reportTypes: reportCounts,
        lastGenerated: data?.[0]?.created_at || null
      };
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      return {};
    }
  }
}

export const enterpriseService = new EnterpriseService();