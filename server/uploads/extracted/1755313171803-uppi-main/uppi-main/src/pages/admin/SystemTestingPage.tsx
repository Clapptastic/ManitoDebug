import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemTestPanel } from '@/components/testing/SystemTestPanel';
import { CompetitorAnalysisDebugger } from '@/components/testing/CompetitorAnalysisDebugger';
import AdminPageLayout from '@/components/layouts/AdminPageLayout';
import { TestTube2, Zap, CheckCircle, Activity } from 'lucide-react';

const SystemTestingPage: React.FC = () => {
  return (
    <AdminPageLayout title="System Testing">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TestTube2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground">
                End-to-end testing tools for competitor analysis functionality
              </p>
            </div>
          </div>
        </div>

      {/* Testing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">API Testing</p>
                <p className="text-xs text-blue-600">Test API key validation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Analysis Testing</p>
                <p className="text-xs text-green-600">Test competitor analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Database Testing</p>
                <p className="text-xs text-purple-600">Test data persistence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Test Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">System Debugger</h2>
            <p className="text-muted-foreground text-sm">
              Debug system components and check for configuration issues.
            </p>
          </div>
          <CompetitorAnalysisDebugger />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">End-to-End Test Runner</h2>
            <p className="text-muted-foreground text-sm">
              Run comprehensive tests to verify that all competitor analysis functionality is working correctly.
            </p>
          </div>
          <SystemTestPanel />
        </div>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Testing Information
          </CardTitle>
          <CardDescription>
            Important information about system testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">What gets tested:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• API key validation and status</li>
                <li>• Competitor analysis edge functions</li>
                <li>• Database save operations</li>
                <li>• Real-time progress updates</li>
                <li>• Error handling and recovery</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Prerequisites:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• At least one active API key configured</li>
                <li>• Supabase connection established</li>
                <li>• Edge functions deployed</li>
                <li>• User authentication working</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminPageLayout>
  );
};

export default SystemTestingPage;