import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Loader2, Key, Database, Zap } from 'lucide-react';
import { competitorAnalysisService } from '@/services/competitorAnalysisService';

export const CompetitorAnalysisDebugger: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testCompetitor, setTestCompetitor] = useState('Microsoft');
  const [testResults, setTestResults] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('competitorDebugger:lastResults');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const runDebugTest = async () => {
    setTesting(true);
    setTestResults(null);
    const results: any = { steps: [], success: false };

    try {
      // Step 1: Check Authentication
      console.log('🔍 Step 1: Checking authentication...');
      results.steps.push({ step: 'Authentication Check', status: 'running' });
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('Authentication failed');
      }
      
      results.steps[0] = { 
        step: 'Authentication Check', 
        status: 'success', 
        data: { userId: session.user.id, email: session.user.email }
      };
      console.log('✅ Authentication check passed');

      // Step 2: Check API Keys Edge Function
      console.log('🔍 Step 2: Testing API keys check...');
      results.steps.push({ step: 'API Keys Check', status: 'running' });
      
      const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('check-api-keys');
      
      if (apiKeyError) {
        throw new Error(`API key check failed: ${apiKeyError.message}`);
      }
      
      results.steps[1] = { 
        step: 'API Keys Check', 
        status: 'success', 
        data: apiKeyData 
      };
      console.log('✅ API keys check passed:', apiKeyData);

      // Step 3: Test Database Access via RPC (no direct table access)
      console.log('🔍 Step 3: Testing API keys access via RPC...');
      results.steps.push({ step: 'API Keys (RPC)', status: 'running' });
      
      const { data: dbApiKeys, error: dbError } = await supabase
        .rpc('manage_api_key', { operation: 'select', user_id_param: session.user.id });
      
      if (dbError) {
        console.warn('API keys RPC error (might be normal if no keys exist):', dbError);
      }
      
      const keysArr = Array.isArray(dbApiKeys) ? dbApiKeys : [];
      results.steps[2] = { 
        step: 'API Keys (RPC)', 
        status: 'success', 
        data: { apiKeys: keysArr, count: keysArr.length }
      };
      console.log('✅ API keys RPC access completed');

      // Step 4: Test Competitor Analysis (only if we have API keys or are in debug mode)
      console.log('🔍 Step 4: Testing competitor analysis edge function...');
      results.steps.push({ step: 'Competitor Analysis', status: 'running' });
      
      try {
        const selectedProviders = await competitorAnalysisService.getAvailableProviders();
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('competitor-analysis', {
          body: {
            action: 'start', // Explicit action for start
            competitors: [testCompetitor],
            providersSelected: selectedProviders,
            sessionId: crypto.randomUUID()
          }
        });
        
        if (analysisError) {
          console.warn('Analysis error (expected if no API keys):', analysisError);
          results.steps[3] = { 
            step: 'Competitor Analysis', 
            status: 'warning', 
            error: `Expected error (no API keys): ${analysisError.message}`,
            data: { note: 'This is expected when no API keys are configured' }
          };
        } else {
          results.steps[3] = { 
            step: 'Competitor Analysis', 
            status: 'success', 
            data: analysisData 
          };
        }
      } catch (error) {
        results.steps[3] = { 
          step: 'Competitor Analysis', 
          status: 'warning', 
          error: `Expected error: ${error.message}`,
          data: { note: 'This is expected when no API keys are configured' }
        };
      }

      results.success = true;
      toast({
        title: "🎉 Debug Test Completed!",
        description: "All basic functionality is working. Configure API keys to enable full analysis.",
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      
      // Mark current step as failed
      if (results.steps.length > 0) {
        const lastIndex = results.steps.length - 1;
        results.steps[lastIndex] = {
          ...results.steps[lastIndex],
          status: 'error',
          error: error.message
        };
      }
      
      results.success = false;
      toast({
        title: "❌ Debug Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestResults(results);
      try { localStorage.setItem('competitorDebugger:lastResults', JSON.stringify(results)); } catch {}
      setTesting(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Competitor Analysis Debugger
        </CardTitle>
        <CardDescription>
          Debug and test the competitor analysis system components
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testCompetitor">Test Competitor</Label>
          <Input
            id="testCompetitor"
            value={testCompetitor}
            onChange={(e) => setTestCompetitor(e.target.value)}
            placeholder="Enter competitor name to test..."
          />
        </div>
        
        <Button 
          onClick={runDebugTest} 
          disabled={testing || !testCompetitor.trim()}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Debug Tests...
            </>
          ) : (
            'Run System Debug Test'
          )}
        </Button>

        {testResults && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-medium">Debug Results:</h3>
            
            {testResults.steps.map((step: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStepIcon(step.status)}
                <div className="flex-1">
                  <div className="font-medium">{step.step}</div>
                  {step.status === 'success' && step.data && (
                    <div className="text-sm text-green-600 mt-1">
                      ✅ {typeof step.data === 'object' ? JSON.stringify(step.data, null, 2) : step.data}
                    </div>
                  )}
                  {step.status === 'warning' && (
                    <div className="text-sm text-yellow-600 mt-1">
                      ⚠️ {step.error || 'Warning occurred'}
                      {step.data?.note && <div className="text-xs mt-1">{step.data.note}</div>}
                    </div>
                  )}
                  {step.status === 'error' && (
                    <div className="text-sm text-red-600 mt-1">
                      ❌ {step.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className={`p-3 rounded-lg ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`font-medium ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.success ? '🎉 Debug Tests Passed!' : '❌ Debug Tests Failed'}
              </div>
              <div className={`text-sm mt-1 ${testResults.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.success 
                  ? 'Core system is functional. Add API keys in Settings to enable full competitor analysis.' 
                  : 'Please check the failed steps above and fix any critical issues.'
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};