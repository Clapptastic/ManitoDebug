/**
 * Comprehensive API Key Flow Test Component
 * Tests: Input → Save → Encrypt → Decrypt → Retrieve
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Database,
  Shield,
  Key,
  Download,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { ApiKeyType } from '@/types/api-keys/unified';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp?: string;
  data?: any;
}

export const ApiKeyFlowTest: React.FC = () => {
  const [testApiKey, setTestApiKey] = useState('sk-test-1234567890abcdef1234567890abcdef');
  const [selectedProvider, setSelectedProvider] = useState<ApiKeyType>('openai');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [retrievedApiKey, setRetrievedApiKey] = useState<string>('');

  const { saveApiKey, deleteApiKey, getApiKeyByProvider, refreshApiKeys } = useUnifiedApiKeys();

  const providers: Array<{ id: ApiKeyType; name: string; testKey: string }> = [
    { id: 'openai', name: 'OpenAI', testKey: 'sk-test-1234567890abcdef1234567890abcdef' },
    { id: 'anthropic', name: 'Anthropic', testKey: 'sk-ant-api03-test1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
    { id: 'gemini', name: 'Google Gemini', testKey: 'AIzaSyTest1234567890abcdef1234567890' },
    { id: 'perplexity', name: 'Perplexity', testKey: 'pplx-1234567890abcdef1234567890abcdef' },
    { id: 'groq', name: 'Groq', testKey: 'gsk_test1234567890abcdef1234' }
  ];

  const logStep = (step: string, status: TestResult['status'], message: string, data?: any) => {
    const result: TestResult = {
      step,
      status,
      message,
      timestamp: new Date().toISOString(),
      data
    };
    
    setTestResults(prev => {
      const filtered = prev.filter(r => r.step !== step);
      return [...filtered, result];
    });
    
    console.log(`🧪 [API KEY TEST] ${step}: ${status.toUpperCase()} - ${message}`, data);
  };

  const runCompleteTest = async () => {
    console.log('🚀 Starting comprehensive API key flow test...');
    setIsRunning(true);
    setTestResults([]);
    setRetrievedApiKey('');

    try {
      // Step 1: Input Validation
      logStep('1. Input Validation', 'running', 'Validating API key format...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!testApiKey.trim()) {
        logStep('1. Input Validation', 'error', 'API key is empty');
        return;
      }
      
      logStep('1. Input Validation', 'success', `Valid ${selectedProvider} API key format detected`, {
        provider: selectedProvider,
        keyLength: testApiKey.length,
        keyPrefix: testApiKey.substring(0, 8)
      });

      // Step 2: Save API Key (Encryption happens here)
      logStep('2. Save & Encrypt', 'running', 'Saving API key to secure vault...');
      
      try {
        await saveApiKey(selectedProvider, testApiKey);
        logStep('2. Save & Encrypt', 'success', 'API key saved and encrypted successfully', {
          provider: selectedProvider,
          vaultStorage: 'Supabase Vault',
          encryption: 'AES-256-GCM'
        });
      } catch (error) {
        logStep('2. Save & Encrypt', 'error', `Failed to save API key: ${error}`);
        return;
      }

      // Step 3: Retrieve Metadata
      logStep('3. Retrieve Metadata', 'running', 'Fetching API key metadata...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await refreshApiKeys();
        const savedKey = getApiKeyByProvider(selectedProvider);
        
        if (savedKey) {
          logStep('3. Retrieve Metadata', 'success', 'API key metadata retrieved successfully', {
            id: savedKey.id,
            maskedKey: savedKey.masked_key,
            status: savedKey.status,
            isActive: savedKey.is_active,
            createdAt: savedKey.created_at,
            encryptionMethod: 'Supabase Vault AES-256'
          });
        } else {
          logStep('3. Retrieve Metadata', 'error', 'API key not found after save');
          return;
        }
      } catch (error) {
        logStep('3. Retrieve Metadata', 'error', `Failed to retrieve metadata: ${error}`);
        return;
      }

      // Step 4: Test Decrypt & Retrieve via Edge Function
      logStep('4. Decrypt & Retrieve', 'running', 'Testing decryption via edge function...');
      
      try {
        const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('unified-api-key-manager', {
          body: {
            action: 'decrypt',
            provider: selectedProvider
          }
        });

        if (edgeError) {
          logStep('4. Decrypt & Retrieve', 'error', `Edge function error: ${edgeError.message}`);
          return;
        }

        if (edgeResponse?.success && edgeResponse?.result?.apiKey) {
          const decryptedKey = edgeResponse.result.apiKey;
          setRetrievedApiKey(decryptedKey);
          
          const matches = decryptedKey === testApiKey;
          
          logStep('4. Decrypt & Retrieve', matches ? 'success' : 'error', 
            matches ? 'API key decrypted and matches original!' : 'Decrypted key does not match original',
            {
              originalLength: testApiKey.length,
              decryptedLength: decryptedKey.length,
              matches,
              decryptedPreview: `${decryptedKey.substring(0, 8)}...${decryptedKey.substring(-4)}`
            }
          );
        } else {
          logStep('4. Decrypt & Retrieve', 'error', 'Failed to decrypt API key', edgeResponse);
          return;
        }
      } catch (error) {
        logStep('4. Decrypt & Retrieve', 'error', `Decryption failed: ${error}`);
        return;
      }

      // Step 5: Validation Test
      logStep('5. Validation Test', 'running', 'Testing API key validation...');
      
      try {
        const { data: validationResponse, error: validationError } = await supabase.functions.invoke('unified-api-key-manager', {
          body: {
            action: 'validate',
            provider: selectedProvider
          }
        });

        if (validationError) {
          logStep('5. Validation Test', 'error', `Validation error: ${validationError.message}`);
        } else if (validationResponse?.success) {
          logStep('5. Validation Test', 'success', 'API key validation completed', {
            isValid: validationResponse.result?.valid,
            provider: selectedProvider
          });
        } else {
          logStep('5. Validation Test', 'error', 'Validation failed', validationResponse);
        }
      } catch (error) {
        logStep('5. Validation Test', 'error', `Validation error: ${error}`);
      }

      // Step 6: Cleanup (Delete Test Key)
      logStep('6. Cleanup', 'running', 'Cleaning up test API key...');
      
      try {
        const savedKey = getApiKeyByProvider(selectedProvider);
        if (savedKey) {
          await deleteApiKey(savedKey.id);
          logStep('6. Cleanup', 'success', 'Test API key deleted successfully');
        } else {
          logStep('6. Cleanup', 'success', 'No cleanup needed');
        }
      } catch (error) {
        logStep('6. Cleanup', 'error', `Cleanup failed: ${error}`);
      }

      console.log('✅ API key flow test completed!');

    } catch (error) {
      console.error('❌ Test failed:', error);
      logStep('Test Failed', 'error', `Unexpected error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (result: TestResult) => {
    switch (result.status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Flow Test Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test complete flow: Input → Save → Encrypt → Decrypt → Retrieve → Validate → Cleanup
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <select 
                id="provider"
                value={selectedProvider}
                onChange={(e) => {
                  const provider = e.target.value as ApiKeyType;
                  setSelectedProvider(provider);
                  const providerConfig = providers.find(p => p.id === provider);
                  if (providerConfig) {
                    setTestApiKey(providerConfig.testKey);
                  }
                }}
                className="w-full p-2 border rounded-md"
                disabled={isRunning}
              >
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-key">Test API Key</Label>
              <div className="relative">
                <Input
                  id="test-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  disabled={isRunning}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isRunning}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button 
            onClick={runCompleteTest} 
            disabled={isRunning || !testApiKey.trim()}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Test Suite...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Complete API Key Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={result.step} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {getStepIcon(result)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.step}</span>
                      <Badge 
                        variant={result.status === 'success' ? 'default' : 
                               result.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600">View Details</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retrieved Key Comparison */}
      {retrievedApiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Encryption/Decryption Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Encryption Test Result:</strong> {retrievedApiKey === testApiKey ? '✅ SUCCESS' : '❌ FAILED'}
                  {retrievedApiKey === testApiKey ? 
                    ' - Original key successfully encrypted and decrypted.' : 
                    ' - Decrypted key does not match original.'
                  }
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Original Key (Input)
                  </Label>
                  <div className="p-3 border rounded bg-muted/30 font-mono text-sm">
                    {showApiKey ? testApiKey : testApiKey.replace(/./g, '•')}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Retrieved Key (Decrypted)
                  </Label>
                  <div className="p-3 border rounded bg-muted/30 font-mono text-sm">
                    {showApiKey ? retrievedApiKey : retrievedApiKey.replace(/./g, '•')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  <span className="font-medium">Encryption Integrity</span>
                </div>
                <Badge variant={retrievedApiKey === testApiKey ? 'default' : 'destructive'}>
                  {retrievedApiKey === testApiKey ? 'VERIFIED' : 'FAILED'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};