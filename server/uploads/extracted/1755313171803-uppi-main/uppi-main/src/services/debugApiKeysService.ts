import { supabase } from '@/integrations/supabase/client';

export interface ApiKeyDebugResult {
  provider: string;
  hasKey: boolean;
  keyFormat: 'valid' | 'invalid' | 'encrypted' | 'unknown';
  decryptionStatus: 'success' | 'failed' | 'not_attempted';
  validationStatus: 'working' | 'failed' | 'not_tested';
  error?: string;
  keyPreview?: string;
  lastValidated?: string;
}

export class DebugApiKeysService {
  async debugAllApiKeys(): Promise<{
    success: boolean;
    results: ApiKeyDebugResult[];
    summary: {
      totalKeys: number;
      workingKeys: number;
      encryptionIssues: number;
      validationIssues: number;
    };
    error?: string;
  }> {
    try {
      console.log('🔐 Starting comprehensive API key debugging...');
      
      // Step 1: Check authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        throw new Error('Authentication failed');
      }

      // Step 2: Test API key debugging edge function
      console.log('🔍 Invoking debug-api-key function...');
      const { data: debugData, error: debugError } = await supabase.functions.invoke('debug-api-key', {
        body: { action: 'debug_all' }
      });

      if (debugError) {
        console.error('❌ Debug API key function error:', debugError);
        throw new Error(`Debug function failed: ${debugError.message}`);
      }

      // Step 3: Get raw API keys from database for comparison
      console.log('🔍 Fetching raw API keys from database...');
      const { data: apiKeys, error: dbError } = await supabase.rpc('manage_api_key', {
        operation: 'select',
        user_id_param: session.user.id
      });

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw new Error(`Database fetch failed: ${dbError.message}`);
      }

      const keys = (apiKeys as any[]) || [];
      console.log(`📊 Found ${keys.length} API keys in database`);

      // Step 4: Test each provider individually
      const providers = ['openai', 'anthropic', 'perplexity', 'gemini', 'groq'];
      const results: ApiKeyDebugResult[] = [];
      
      for (const provider of providers) {
        const dbKey = keys.find(k => k.provider === provider);
        const result: ApiKeyDebugResult = {
          provider,
          hasKey: !!dbKey,
          keyFormat: 'unknown',
          decryptionStatus: 'not_attempted',
          validationStatus: 'not_tested'
        };

        if (dbKey) {
          result.keyPreview = dbKey.masked_key;
          result.lastValidated = dbKey.last_validated;

          // Test decryption by calling edge function validation
          try {
            console.log(`🔐 Testing ${provider} key decryption...`);
            const { data: validateData, error: validateError } = await supabase.functions.invoke('validate-api-key', {
              body: { provider }
            });

            if (validateError) {
              result.error = validateError.message;
              result.decryptionStatus = 'failed';
              result.validationStatus = 'failed';
            } else if (validateData) {
              result.decryptionStatus = 'success';
              result.validationStatus = validateData.isValid ? 'working' : 'failed';
              result.keyFormat = validateData.isValid ? 'valid' : 'invalid';
              if (!validateData.isValid && validateData.error) {
                result.error = validateData.error;
              }
            }
          } catch (error: any) {
            result.error = error.message;
            result.decryptionStatus = 'failed';
            result.validationStatus = 'failed';
          }
        }

        results.push(result);
      }

      // Step 5: Calculate summary
      const summary = {
        totalKeys: results.filter(r => r.hasKey).length,
        workingKeys: results.filter(r => r.validationStatus === 'working').length,
        encryptionIssues: results.filter(r => r.decryptionStatus === 'failed').length,
        validationIssues: results.filter(r => r.validationStatus === 'failed').length
      };

      console.log('📊 API key debugging summary:', summary);

      return {
        success: true,
        results,
        summary
      };

    } catch (error: any) {
      console.error('❌ API key debugging failed:', error);
      return {
        success: false,
        results: [],
        summary: { totalKeys: 0, workingKeys: 0, encryptionIssues: 0, validationIssues: 0 },
        error: error.message
      };
    }
  }

  async testSpecificProvider(provider: string): Promise<ApiKeyDebugResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      // Get the key from database
      const { data: keyData } = await supabase.rpc('manage_api_key', {
        operation: 'get_for_decryption',
        user_id_param: session.user.id,
        provider_param: provider
      });

      const result: ApiKeyDebugResult = {
        provider,
        hasKey: !!keyData,
        keyFormat: 'unknown',
        decryptionStatus: 'not_attempted',
        validationStatus: 'not_tested'
      };

      if (!keyData) {
        result.error = 'No API key found for this provider';
        return result;
      }

      // Test validation
      const { data: validateData, error: validateError } = await supabase.functions.invoke('validate-api-key', {
        body: { provider }
      });

      if (validateError) {
        result.error = validateError.message;
        result.decryptionStatus = 'failed';
        result.validationStatus = 'failed';
      } else {
        result.decryptionStatus = 'success';
        result.validationStatus = validateData?.isValid ? 'working' : 'failed';
        result.keyFormat = validateData?.isValid ? 'valid' : 'invalid';
        if (!validateData?.isValid && validateData?.error) {
          result.error = validateData.error;
        }
      }

      return result;
    } catch (error: any) {
      return {
        provider,
        hasKey: false,
        keyFormat: 'unknown',
        decryptionStatus: 'failed',
        validationStatus: 'failed',
        error: error.message
      };
    }
  }

  async fixCorruptedKeys(): Promise<{ success: boolean; fixed: string[]; errors: string[] }> {
    try {
      const { data, error } = await supabase.functions.invoke('debug-api-key', {
        body: { action: 'fix_corrupted' }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data || { success: false, fixed: [], errors: ['No response from fix function'] };
    } catch (error: any) {
      return {
        success: false,
        fixed: [],
        errors: [error.message]
      };
    }
  }
}

export const debugApiKeysService = new DebugApiKeysService();