import { supabase } from "@/integrations/supabase/client";

export interface CustomReport {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  query_config: any;
  chart_config: any;
  schedule_config: any;
  is_shared: boolean;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportSchedule {
  id: string;
  report_id: string;
  frequency: string;
  recipients: string[];
  is_active: boolean;
  last_sent_at?: string;
  next_send_at?: string;
  created_at: string;
}

export interface CreateReportRequest {
  name: string;
  description?: string;
  query_config: Record<string, any>;
  chart_config?: Record<string, any>;
  schedule_config?: Record<string, any>;
  is_shared?: boolean;
}

export interface CreateScheduleRequest {
  report_id: string;
  frequency: string;
  recipients: string[];
  is_active?: boolean;
}

export class CustomReportsService {
  /**
   * Get all reports for current user
   */
  async getReports(): Promise<CustomReport[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  /**
   * Get shared reports
   */
  async getSharedReports(): Promise<CustomReport[]> {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .eq('is_shared', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shared reports:', error);
      return [];
    }
  }

  /**
   * Get single report by ID
   */
  async getReport(id: string): Promise<CustomReport | null> {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  }

  /**
   * Create new report
   */
  async createReport(reportData: CreateReportRequest): Promise<CustomReport | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('custom_reports')
        .insert({
          user_id: user.id,
          name: reportData.name,
          description: reportData.description,
          query_config: reportData.query_config,
          chart_config: reportData.chart_config || {},
          schedule_config: reportData.schedule_config || {},
          is_shared: reportData.is_shared || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      return null;
    }
  }

  /**
   * Update report
   */
  async updateReport(id: string, updates: Partial<CreateReportRequest>): Promise<CustomReport | null> {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating report:', error);
      return null;
    }
  }

  /**
   * Delete report
   */
  async deleteReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('custom_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }

  /**
   * Run report and update last_run_at
   */
  async runReport(id: string): Promise<any> {
    try {
      // Update last_run_at timestamp
      await supabase
        .from('custom_reports')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', id);

      // Get the report configuration
      const report = await this.getReport(id);
      if (!report) throw new Error('Report not found');

      // Execute the query based on query_config
      // This would typically involve calling appropriate APIs based on the query configuration
      // For now, return a placeholder response
      return {
        success: true,
        data: [],
        executed_at: new Date().toISOString(),
        query_config: report.query_config
      };
    } catch (error) {
      console.error('Error running report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get schedules for a report
   */
  async getReportSchedules(reportId: string): Promise<ReportSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching report schedules:', error);
      return [];
    }
  }

  /**
   * Create report schedule
   */
  async createSchedule(scheduleData: CreateScheduleRequest): Promise<ReportSchedule | null> {
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .insert({
          report_id: scheduleData.report_id,
          frequency: scheduleData.frequency,
          recipients: scheduleData.recipients,
          is_active: scheduleData.is_active !== false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      return null;
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(id: string, updates: Partial<CreateScheduleRequest>): Promise<ReportSchedule | null> {
    try {
      const { data, error } = await supabase
        .from('report_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating schedule:', error);
      return null;
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return false;
    }
  }
}

export const customReportsService = new CustomReportsService();