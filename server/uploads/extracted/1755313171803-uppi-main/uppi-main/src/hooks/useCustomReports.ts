import { useState, useEffect } from 'react';
import { customReportsService, CustomReport, CreateReportRequest, ReportSchedule } from '@/services/core/customReportsService';
import { toast } from 'sonner';

interface UseCustomReportsReturn {
  reports: CustomReport[];
  sharedReports: CustomReport[];
  isLoading: boolean;
  createReport: (reportData: CreateReportRequest) => Promise<CustomReport | null>;
  updateReport: (id: string, updates: Partial<CreateReportRequest>) => Promise<CustomReport | null>;
  deleteReport: (id: string) => Promise<boolean>;
  runReport: (id: string) => Promise<any>;
  refreshReports: () => Promise<void>;
}

export function useCustomReports(): UseCustomReportsReturn {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [sharedReports, setSharedReports] = useState<CustomReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const [userReports, shared] = await Promise.all([
        customReportsService.getReports(),
        customReportsService.getSharedReports()
      ]);
      
      setReports(userReports);
      setSharedReports(shared);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const createReport = async (reportData: CreateReportRequest): Promise<CustomReport | null> => {
    try {
      const newReport = await customReportsService.createReport(reportData);
      if (newReport) {
        setReports(prev => [newReport, ...prev]);
        toast.success('Report created successfully');
      }
      return newReport;
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Failed to create report');
      return null;
    }
  };

  const updateReport = async (id: string, updates: Partial<CreateReportRequest>): Promise<CustomReport | null> => {
    try {
      const updatedReport = await customReportsService.updateReport(id, updates);
      if (updatedReport) {
        setReports(prev => prev.map(report => 
          report.id === id ? updatedReport : report
        ));
        toast.success('Report updated successfully');
      }
      return updatedReport;
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
      return null;
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      const success = await customReportsService.deleteReport(id);
      if (success) {
        setReports(prev => prev.filter(report => report.id !== id));
        toast.success('Report deleted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
      return false;
    }
  };

  const runReport = async (id: string): Promise<any> => {
    try {
      toast.info('Running report...');
      const result = await customReportsService.runReport(id);
      
      if (result.success) {
        // Update the last_run_at timestamp in local state
        setReports(prev => prev.map(report => 
          report.id === id 
            ? { ...report, last_run_at: new Date().toISOString() }
            : report
        ));
        toast.success('Report executed successfully');
      } else {
        toast.error(`Report execution failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error running report:', error);
      toast.error('Failed to run report');
      return { success: false, error: 'Unknown error' };
    }
  };

  const refreshReports = async () => {
    await loadReports();
  };

  return {
    reports,
    sharedReports,
    isLoading,
    createReport,
    updateReport,
    deleteReport,
    runReport,
    refreshReports
  };
}

// Hook for managing report schedules
export function useReportSchedules(reportId: string) {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reportId) {
      loadSchedules();
    }
  }, [reportId]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const reportSchedules = await customReportsService.getReportSchedules(reportId);
      setSchedules(reportSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async (scheduleData: { frequency: string; recipients: string[]; is_active?: boolean }) => {
    try {
      const newSchedule = await customReportsService.createSchedule({
        ...scheduleData,
        report_id: reportId
      });
      
      if (newSchedule) {
        setSchedules(prev => [newSchedule, ...prev]);
        toast.success('Schedule created successfully');
      }
      
      return newSchedule;
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
      return null;
    }
  };

  const updateSchedule = async (id: string, updates: any) => {
    try {
      const updatedSchedule = await customReportsService.updateSchedule(id, updates);
      if (updatedSchedule) {
        setSchedules(prev => prev.map(schedule => 
          schedule.id === id ? updatedSchedule : schedule
        ));
        toast.success('Schedule updated successfully');
      }
      return updatedSchedule;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
      return null;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const success = await customReportsService.deleteSchedule(id);
      if (success) {
        setSchedules(prev => prev.filter(schedule => schedule.id !== id));
        toast.success('Schedule deleted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
      return false;
    }
  };

  return {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshSchedules: loadSchedules
  };
}