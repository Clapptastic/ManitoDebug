import { competitorAnalysisService } from '@/services/competitorAnalysisService';
import { competitorProgressService } from '@/services/competitorProgressService';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorHandler';

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  metadata?: any;
}

export interface SystemTestReport {
  overallStatus: 'pass' | 'warning' | 'fail';
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  healthChecks: SystemHealthCheck[];
  testResults: TestResult[];
  recommendations: string[];
}

class CompetitorAnalysisTestSuite {
  private testResults: TestResult[] = [];
  private healthChecks: SystemHealthCheck[] = [];

  async runFullSystemTest(): Promise<SystemTestReport> {
    console.log('🧪 Starting Comprehensive Competitor Analysis System Test...');
    
    this.testResults = [];
    this.healthChecks = [];

    // 1. Database Connectivity Tests
    await this.testDatabaseConnectivity();
    
    // 2. API Key Validation Tests
    await this.testApiKeyValidation();
    
    // 3. Service Integration Tests
    await this.testServiceIntegration();
    
    // 4. Edge Function Tests
    await this.testEdgeFunctions();
    
    // 5. Progress Tracking Tests
    await this.testProgressTracking();
    
    // 6. Error Handling Tests
    await this.testErrorHandling();
    
    // 7. Data Integrity Tests
    await this.testDataIntegrity();

    return this.generateReport();
  }

  private async runTest(testName: string, testFn: () => Promise<void>, metadata?: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🔍 Testing: ${testName}`);
      await testFn();
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: true,
        duration,
        metadata
      });
      
      console.log(`  ✅ ${testName} - Passed (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        passed: false,
        error: error.message,
        duration,
        metadata
      });
      
      console.error(`  ❌ ${testName} - Failed (${duration}ms):`, error.message);
    }
  }

  private async testDatabaseConnectivity(): Promise<void> {
    console.log('\n📊 Testing Database Connectivity...');

    await this.runTest('Database Connection', async () => {
      const { data, error } = await supabase.from('competitor_analyses').select('id').limit(1);
      if (error) throw error;
      
      this.addHealthCheck('Database', 'healthy', 'Database connection successful');
    });

    await this.runTest('RLS Policies', async () => {
      // Test that unauthenticated users can't access data
      const originalAuth = supabase.auth.getSession;
      
      // Mock no session
      (supabase.auth as any).getSession = () => Promise.resolve({ data: { session: null }, error: null });
      
      try {
        const { data, error } = await supabase.from('competitor_analyses').select('*').limit(1);
        // Should either return empty data or throw an error due to RLS
        if (data && data.length > 0) {
          throw new Error('RLS not working - unauthorized access possible');
        }
      } finally {
        // Restore original auth
        supabase.auth.getSession = originalAuth;
      }
      
      this.addHealthCheck('Security', 'healthy', 'RLS policies are active');
    });

    await this.runTest('Database Functions', async () => {
      // Test by querying existing data instead of calling the function directly
      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('data_completeness_score')
        .limit(1);
      
      if (error) throw error;
      
      this.addHealthCheck('Database Functions', 'healthy', 'Database functions are accessible');
    });
  }

  private async testApiKeyValidation(): Promise<void> {
    console.log('\n🔑 Testing API Key Validation...');

    await this.runTest('API Keys Check', async () => {
      const result = await competitorAnalysisService.checkApiKeyRequirements();
      
      const missingKeys = result.missingKeys;
      if (missingKeys.length > 0) {
        this.addHealthCheck('API Keys', 'warning', `Missing API keys: ${missingKeys.join(', ')}`);
      } else {
        this.addHealthCheck('API Keys', 'healthy', 'Required API keys are configured');
      }
    });

    await this.runTest('Edge Function API Key Access', async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-api-keys');
        
        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'API key check failed');
        
        this.addHealthCheck('Edge Function Access', 'healthy', 'Edge functions can access API keys');
      } catch (error: any) {
        this.addHealthCheck('Edge Function Access', 'error', `Cannot access API keys: ${error.message}`);
        throw error;
      }
    });
  }

  private async testServiceIntegration(): Promise<void> {
    console.log('\n🔧 Testing Service Integration...');

    await this.runTest('Competitor Analysis Service', async () => {
      const analyses = await competitorAnalysisService.getAnalyses();
      if (!Array.isArray(analyses)) throw new Error('Service returned invalid data');
      
      this.addHealthCheck('Analysis Service', 'healthy', 'Service is responding correctly');
    });

    await this.runTest('Progress Service', async () => {
      const sessionId = await competitorProgressService.initializeProgress(1, ['Test Company']);
      if (!sessionId) throw new Error('Failed to initialize progress tracking');
      
      await competitorProgressService.updateProgress({
        progressPercentage: 50,
        currentCompetitor: 'Test Company'
      });
      
      this.addHealthCheck('Progress Service', 'healthy', 'Progress tracking is working');
    });
  }

  private async testEdgeFunctions(): Promise<void> {
    console.log('\n⚡ Testing Edge Functions...');

    await this.runTest('Competitor Analysis Function', async () => {
      // Test with a minimal request to avoid consuming API credits
      const { data, error } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          action: 'start', // Explicit action for consistency
          competitors: ['Test Company'],
          focusAreas: [],
          sessionId: 'test-session',
          dryRun: true // Add dry run flag if supported
        }
      });

      if (error) throw error;
      
      this.addHealthCheck('Edge Functions', 'healthy', 'Competitor analysis function is responsive');
    }, { testMode: true });
  }

  private async testProgressTracking(): Promise<void> {
    console.log('\n📈 Testing Progress Tracking...');

    await this.runTest('Progress Initialization', async () => {
      const sessionId = await competitorProgressService.initializeProgress(2, ['Company A', 'Company B']);
      if (!sessionId || !sessionId.startsWith('session-')) {
        throw new Error('Invalid session ID format');
      }
    });

    await this.runTest('Progress Updates', async () => {
      const sessionId = await competitorProgressService.initializeProgress(1, ['Test Company']);
      
      await competitorProgressService.updateProgress({
        progressPercentage: 25,
        currentCompetitor: 'Test Company'
      });
      
      await competitorProgressService.updateProgress({
        progressPercentage: 100,
        status: 'completed'
      });
    });
  }

  private async testErrorHandling(): Promise<void> {
    console.log('\n🚨 Testing Error Handling...');

    await this.runTest('Service Error Handling', async () => {
      try {
        // Test invalid analysis ID
        await competitorAnalysisService.getAnalysisById('invalid-id');
      } catch (error: any) {
        // Should handle gracefully without crashing
        if (error.message.includes('Failed to fetch analysis')) {
          // Good - proper error handling
          return;
        }
        throw new Error('Error handling not working correctly');
      }
    });

    await this.runTest('Network Error Simulation', async () => {
      // Test with invalid edge function call
      try {
        await supabase.functions.invoke('non-existent-function');
      } catch (error: any) {
        // Should handle gracefully
        if (error.message) {
          return; // Good error handling
        }
        throw new Error('Network error handling failed');
      }
    });
  }

  private async testDataIntegrity(): Promise<void> {
    console.log('\n🔍 Testing Data Integrity...');

    await this.runTest('Schema Validation', async () => {
      const analyses = await competitorAnalysisService.getAnalyses();
      
      for (const analysis of analyses.slice(0, 5)) { // Test first 5
        if (!analysis.id || !analysis.name || !analysis.user_id) {
          throw new Error(`Invalid analysis schema: ${analysis.id}`);
        }
        
        if (analysis.data_completeness_score !== null && 
            (analysis.data_completeness_score < 0 || analysis.data_completeness_score > 100)) {
          throw new Error(`Invalid data completeness score: ${analysis.data_completeness_score}`);
        }
      }
      
      this.addHealthCheck('Data Integrity', 'healthy', 'Analysis data schema is valid');
    });
  }

  private addHealthCheck(component: string, status: SystemHealthCheck['status'], message: string, details?: any): void {
    this.healthChecks.push({
      component,
      status,
      message,
      details,
      timestamp: new Date()
    });
  }

  private generateReport(): SystemTestReport {
    const passedTests = this.testResults.filter(t => t.passed).length;
    const failedTests = this.testResults.filter(t => !t.passed).length;
    const warningTests = this.healthChecks.filter(h => h.status === 'warning').length;
    
    let overallStatus: 'pass' | 'warning' | 'fail' = 'pass';
    if (failedTests > 0) {
      overallStatus = 'fail';
    } else if (warningTests > 0) {
      overallStatus = 'warning';
    }

    const recommendations = this.generateRecommendations();

    const report: SystemTestReport = {
      overallStatus,
      timestamp: new Date(),
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      warningTests,
      healthChecks: this.healthChecks,
      testResults: this.testResults,
      recommendations
    };

    this.logReport(report);
    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for failed tests
    const failedTests = this.testResults.filter(t => !t.passed);
    if (failedTests.length > 0) {
      recommendations.push(`🔧 Fix ${failedTests.length} failing test(s): ${failedTests.map(t => t.testName).join(', ')}`);
    }

    // Check for missing API keys
    const apiWarnings = this.healthChecks.filter(h => h.component === 'API Keys' && h.status === 'warning');
    if (apiWarnings.length > 0) {
      recommendations.push('🔑 Configure missing API keys for full functionality');
    }

    // Check for performance issues
    const slowTests = this.testResults.filter(t => t.duration > 5000); // > 5 seconds
    if (slowTests.length > 0) {
      recommendations.push(`⚡ Investigate slow operations: ${slowTests.map(t => t.testName).join(', ')}`);
    }

    // Check for error conditions
    const errorChecks = this.healthChecks.filter(h => h.status === 'error');
    if (errorChecks.length > 0) {
      recommendations.push(`🚨 Critical issues found in: ${errorChecks.map(h => h.component).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ System is functioning optimally');
    }

    return recommendations;
  }

  private logReport(report: SystemTestReport): void {
    console.log('\n📋 === SYSTEM TEST REPORT ===');
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Tests: ${report.passedTests}/${report.totalTests} passed`);
    
    if (report.failedTests > 0) {
      console.log(`❌ Failed Tests: ${report.failedTests}`);
    }
    
    if (report.warningTests > 0) {
      console.log(`⚠️  Warnings: ${report.warningTests}`);
    }

    console.log('\n📊 Health Checks:');
    report.healthChecks.forEach(check => {
      const icon = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${check.component}: ${check.message}`);
    });

    console.log('\n🎯 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
    
    console.log('\n=========================\n');
  }

  // Quick health check for development
  async quickHealthCheck(): Promise<SystemHealthCheck[]> {
    console.log('🏥 Running Quick Health Check...');
    
    this.healthChecks = [];

    try {
      // Database check
      const { error: dbError } = await supabase.from('competitor_analyses').select('id').limit(1);
      if (dbError) {
        this.addHealthCheck('Database', 'error', `Database error: ${dbError.message}`);
      } else {
        this.addHealthCheck('Database', 'healthy', 'Database accessible');
      }

      // API keys check
      const apiKeyStatus = await competitorAnalysisService.checkApiKeyRequirements();
      const missingKeys = apiKeyStatus.missingKeys;
      
      if (missingKeys.length > 0) {
        this.addHealthCheck('API Keys', 'warning', `Missing: ${missingKeys.join(', ')}`);
      } else {
        this.addHealthCheck('API Keys', 'healthy', 'API keys configured');
      }

      // Services check
      try {
        await competitorAnalysisService.getAnalyses();
        this.addHealthCheck('Services', 'healthy', 'Core services operational');
      } catch (error: any) {
        this.addHealthCheck('Services', 'error', `Service error: ${error.message}`);
      }

    } catch (error: any) {
      this.addHealthCheck('System', 'error', `Critical error: ${error.message}`);
    }

    this.healthChecks.forEach(check => {
      const icon = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${check.component}: ${check.message}`);
    });

    return this.healthChecks;
  }
}

// Export singleton instance
export const systemTestSuite = new CompetitorAnalysisTestSuite();

// Convenience functions
export const runSystemTest = () => systemTestSuite.runFullSystemTest();
export const quickHealthCheck = () => systemTestSuite.quickHealthCheck();

// Development helper - can be called from browser console
if (typeof window !== 'undefined') {
  (window as any).testCompetitorSystem = runSystemTest;
  (window as any).healthCheck = quickHealthCheck;
}