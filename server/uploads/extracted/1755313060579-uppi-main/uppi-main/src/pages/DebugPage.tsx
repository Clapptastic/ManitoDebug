import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { debugService } from '@/services/debugService';
import { competitorDebugService, DebugTestResult } from '@/services/competitorDebugService';
import { CheckCircle, XCircle, AlertCircle, Play, Bug, Database, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

const DebugPage: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState('');

  const runFullDebug = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const debugResults = await debugService.runFullDebugFlow();
      setResults(debugResults);
    } catch (error: any) {
      console.error('Debug error:', error);
      setResults([{
        step: 'debug_error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testSpecificAnalysis = async () => {
    if (!analysisId.trim()) return;
    
    setLoading(true);
    try {
      const result = await debugService.testSpecificAnalysis(analysisId);
      setResults([result]);
    } catch (error: any) {
      setResults([{
        step: 'specific_analysis_error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testAnalysisFlow = async () => {
    setLoading(true);
    try {
      const result = await debugService.testCompetitorAnalysisFlow(['microsoft']);
      setResults([result]);
    } catch (error: any) {
      setResults([{
        step: 'analysis_flow_error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runCompleteFlowTest = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const results = await competitorDebugService.runCompleteFlowTest();
      setResults(results);
    } catch (error: any) {
      console.error('Complete flow test error:', error);
      setResults([{
        step: 'complete_flow_error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseDirectly = async () => {
    setLoading(true);
    try {
      const result = await competitorDebugService.checkDatabaseDirectly();
      setResults([result]);
    } catch (error: any) {
      setResults([{
        step: 'database_check_error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Competitor Analysis Debug Center</h1>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This debug interface tests the entire competitor analysis data flow from AI APIs to frontend display.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Full System Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runFullDebug} 
              disabled={loading}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Complete Debug Flow
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              End-to-End Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runCompleteFlowTest} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              Test Complete Data Flow
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Check</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkDatabaseDirectly} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Check Database Directly
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Specific Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <input
              type="text"
              placeholder="Analysis ID"
              value={analysisId}
              onChange={(e) => setAnalysisId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <Button 
              onClick={testSpecificAnalysis} 
              disabled={loading || !analysisId.trim()}
              variant="outline"
              className="w-full"
            >
              Test Analysis
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Analysis Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testAnalysisFlow} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Test Live Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Debug Results Summary
              <Badge variant={successCount === totalCount ? "default" : "destructive"}>
                {successCount}/{totalCount} PASSED
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{totalCount - successCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detailed Test Results</h2>
          {results.map((result, index) => (
            <Card key={index} className={`border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.success)}
                    <CardTitle className="text-lg capitalize">
                      {result.step.replace(/_/g, ' ')}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.success)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {result.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700">{result.error}</p>
                  </div>
                )}
                {result.data && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-2">Debug Data:</p>
                    <pre className="text-sm overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="py-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-lg">Running debug tests...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DebugPage;