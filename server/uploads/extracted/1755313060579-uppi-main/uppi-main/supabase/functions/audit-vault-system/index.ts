import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuditResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface VaultAuditReport {
  overall_status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  results: AuditResult[];
  recommendations: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 Starting Supabase Vault System Audit');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const auditResults: AuditResult[] = [];
    const recommendations: string[] = [];

    // Test 1: Check Vault Extension Availability
    console.log('📋 Testing vault extension availability...');
    try {
      const { data: extensions, error: extError } = await supabaseAdmin
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vault');

      if (extError) throw extError;

      if (extensions && extensions.length > 0) {
        auditResults.push({
          component: 'vault_extension',
          status: 'pass',
          message: 'Vault extension is installed and available'
        });
      } else {
        auditResults.push({
          component: 'vault_extension',
          status: 'fail',
          message: 'Vault extension is not installed'
        });
        recommendations.push('Install the vault extension: CREATE EXTENSION IF NOT EXISTS vault;');
      }
    } catch (error) {
      auditResults.push({
        component: 'vault_extension',
        status: 'fail',
        message: 'Failed to check vault extension',
        details: error.message
      });
    }

    // Test 2: Test Vault Secret Creation and Retrieval
    console.log('🔐 Testing vault secret operations...');
    const testSecretName = `audit_test_${Date.now()}`;
    const testSecretValue = `test_value_${Math.random()}`;
    
    try {
      // Test secret creation
      const { data: createResult, error: createError } = await supabaseAdmin
        .rpc('vault_create_secret', {
          secret_name: testSecretName,
          secret_value: testSecretValue
        });

      if (createError) throw createError;

      // Test secret retrieval
      const { data: retrieveResult, error: retrieveError } = await supabaseAdmin
        .rpc('vault_get_secret', {
          secret_name: testSecretName
        });

      if (retrieveError) throw retrieveError;

      if (retrieveResult === testSecretValue) {
        auditResults.push({
          component: 'vault_operations',
          status: 'pass',
          message: 'Vault secret creation and retrieval working correctly'
        });
      } else {
        auditResults.push({
          component: 'vault_operations',
          status: 'fail',
          message: 'Vault secret retrieval returned incorrect value',
          details: { expected: testSecretValue, received: retrieveResult }
        });
      }

      // Clean up test secret
      try {
        await supabaseAdmin.rpc('vault_delete_secret', {
          secret_name: testSecretName
        });
      } catch (cleanupError) {
        console.warn('Failed to cleanup test secret:', cleanupError);
      }

    } catch (error) {
      auditResults.push({
        component: 'vault_operations',
        status: 'fail',
        message: 'Vault operations failed',
        details: error.message
      });
      recommendations.push('Ensure vault functions are properly configured and accessible');
    }

    // Test 3: Check API Keys Table Structure and Permissions
    console.log('🗃️ Testing API keys table structure...');
    try {
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'api_keys')
        .eq('table_schema', 'public');

      if (tableError) throw tableError;

      const requiredColumns = ['vault_secret_id', 'user_id', 'provider', 'masked_key', 'is_active'];
      const missingColumns = requiredColumns.filter(col => 
        !tableInfo?.some(info => info.column_name === col)
      );

      if (missingColumns.length === 0) {
        auditResults.push({
          component: 'api_keys_schema',
          status: 'pass',
          message: 'API keys table has all required columns'
        });
      } else {
        auditResults.push({
          component: 'api_keys_schema',
          status: 'fail',
          message: 'API keys table missing required columns',
          details: { missing_columns: missingColumns }
        });
      }

    } catch (error) {
      auditResults.push({
        component: 'api_keys_schema',
        status: 'fail',
        message: 'Failed to check API keys table structure',
        details: error.message
      });
    }

    // Test 4: Check RLS Policies
    console.log('🛡️ Testing RLS policies...');
    try {
      const { data: policies, error: policyError } = await supabaseAdmin
        .from('pg_policies')
        .select('policyname, tablename, cmd')
        .eq('tablename', 'api_keys')
        .eq('schemaname', 'public');

      if (policyError) throw policyError;

      if (policies && policies.length > 0) {
        auditResults.push({
          component: 'rls_policies',
          status: 'pass',
          message: `Found ${policies.length} RLS policies for api_keys table`,
          details: policies
        });
      } else {
        auditResults.push({
          component: 'rls_policies',
          status: 'warning',
          message: 'No RLS policies found for api_keys table'
        });
        recommendations.push('Ensure proper RLS policies are in place for the api_keys table');
      }

    } catch (error) {
      auditResults.push({
        component: 'rls_policies',
        status: 'fail',
        message: 'Failed to check RLS policies',
        details: error.message
      });
    }

    // Test 5: Test API Key Management Functions
    console.log('⚙️ Testing API key management functions...');
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000'; // Test UUID
      
      const { data: functionResult, error: functionError } = await supabaseAdmin
        .rpc('manage_api_key', {
          operation: 'select',
          user_id_param: testUserId
        });

      if (functionError && !functionError.message.includes('Access denied')) {
        throw functionError;
      }

      auditResults.push({
        component: 'api_key_functions',
        status: 'pass',
        message: 'API key management functions are accessible'
      });

    } catch (error) {
      auditResults.push({
        component: 'api_key_functions',
        status: 'fail',
        message: 'API key management functions failed',
        details: error.message
      });
    }

    // Test 6: Test Edge Function Authentication
    console.log('🌐 Testing edge function authentication...');
    try {
      const { data: authTest, error: authError } = await supabaseAdmin.auth.getUser();
      
      if (authTest?.user || authError?.message.includes('JWT')) {
        auditResults.push({
          component: 'edge_function_auth',
          status: 'pass',
          message: 'Edge function authentication is working'
        });
      } else {
        auditResults.push({
          component: 'edge_function_auth',
          status: 'warning',
          message: 'Edge function authentication may have issues'
        });
      }

    } catch (error) {
      auditResults.push({
        component: 'edge_function_auth',
        status: 'fail',
        message: 'Edge function authentication failed',
        details: error.message
      });
    }

    // Test 7: Check Environment Variables
    console.log('🔧 Testing environment configuration...');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !Deno.env.get(envVar));

    if (missingEnvVars.length === 0) {
      auditResults.push({
        component: 'environment_config',
        status: 'pass',
        message: 'All required environment variables are set'
      });
    } else {
      auditResults.push({
        component: 'environment_config',
        status: 'fail',
        message: 'Missing required environment variables',
        details: { missing: missingEnvVars }
      });
    }

    // Determine overall status
    const hasFailures = auditResults.some(result => result.status === 'fail');
    const hasWarnings = auditResults.some(result => result.status === 'warning');
    
    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (hasFailures) {
      overallStatus = 'critical';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Add general recommendations
    if (overallStatus !== 'healthy') {
      recommendations.push('Review and fix failed audit items before using vault functionality in production');
      recommendations.push('Test API key encryption/decryption workflows manually');
      recommendations.push('Verify edge function permissions and authentication');
    }

    const report: VaultAuditReport = {
      overall_status: overallStatus,
      timestamp: new Date().toISOString(),
      results: auditResults,
      recommendations
    };

    console.log('✅ Vault audit completed:', overallStatus);

    return new Response(
      JSON.stringify(report, null, 2),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Vault audit failed:', error);
    
    const errorReport: VaultAuditReport = {
      overall_status: 'critical',
      timestamp: new Date().toISOString(),
      results: [{
        component: 'audit_system',
        status: 'fail',
        message: 'Audit system itself failed to execute',
        details: error.message
      }],
      recommendations: [
        'Check edge function deployment and permissions',
        'Verify Supabase service role key is correctly configured',
        'Review edge function logs for detailed error information'
      ]
    };

    return new Response(
      JSON.stringify(errorReport, null, 2),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});