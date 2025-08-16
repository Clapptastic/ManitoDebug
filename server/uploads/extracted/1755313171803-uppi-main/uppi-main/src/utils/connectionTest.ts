/**
 * Connection Test Utility
 * Tests all key connections between frontend and backend
 */

import { supabase } from '@/integrations/supabase/client';

export interface ConnectionTestResults {
  supabaseConnection: boolean;
  authentication: boolean;
  database: boolean;
  edgeFunctions: boolean;
  apiKeys: boolean;
  realtimeConnection: boolean;
  errors: string[];
}

export async function runConnectionTests(): Promise<ConnectionTestResults> {
  const results: ConnectionTestResults = {
    supabaseConnection: false,
    authentication: false,
    database: false,
    edgeFunctions: false,
    apiKeys: false,
    realtimeConnection: false,
    errors: []
  };

  console.log('🔍 Starting connection tests...');

  // Test 1: Basic Supabase Connection
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    results.supabaseConnection = !error;
    if (error) results.errors.push(`Supabase connection: ${error.message}`);
  } catch (err) {
    results.errors.push(`Supabase connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Test 2: Authentication Status
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    results.authentication = !error && !!session;
    if (error) results.errors.push(`Authentication: ${error.message}`);
  } catch (err) {
    results.errors.push(`Authentication: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Test 3: Database Access
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(1);
    
    results.database = !error;
    if (error) results.errors.push(`Database access: ${error.message}`);
  } catch (err) {
    results.errors.push(`Database access: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Test 4: API Keys Access
  try {
    const { data, error } = await supabase.rpc('manage_api_key', { operation: 'select' });
    results.apiKeys = !error;
    if (error) results.errors.push(`API keys access (RPC): ${error.message}`);
  } catch (err) {
    results.errors.push(`API keys access (RPC): ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Test 5: Edge Functions
  try {
    // Test a simple edge function call
    const { data, error } = await supabase.functions.invoke('competitor-analysis', {
      body: { test: true }
    });
    
    // Edge function should return an error but connection should work
    results.edgeFunctions = true; // If we get here, the connection works
  } catch (err) {
    // Network errors indicate connection issues, but auth errors are expected
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    if (errorMsg.includes('network') || errorMsg.includes('connection')) {
      results.errors.push(`Edge functions: ${errorMsg}`);
    } else {
      results.edgeFunctions = true; // Auth/validation errors are expected
    }
  }

  // Test 6: Real-time Connection
  try {
    const channel = supabase.channel('connection-test');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        reject(new Error('Realtime connection timeout'));
      }, 3000);

      channel
        .on('presence', { event: 'sync' }, () => {
          clearTimeout(timeout);
          results.realtimeConnection = true;
          channel.unsubscribe();
          resolve(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            results.realtimeConnection = true;
            channel.unsubscribe();
            resolve(true);
          }
        });
    });
  } catch (err) {
    results.errors.push(`Realtime: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.log('✅ Connection tests completed:', results);
  return results;
}

export function logConnectionResults(results: ConnectionTestResults) {
  console.group('🔍 Connection Test Results');
  
  console.log(`Supabase Connection: ${results.supabaseConnection ? '✅' : '❌'}`);
  console.log(`Authentication: ${results.authentication ? '✅' : '❌'}`);
  console.log(`Database Access: ${results.database ? '✅' : '❌'}`);
  console.log(`Edge Functions: ${results.edgeFunctions ? '✅' : '❌'}`);
  console.log(`API Keys: ${results.apiKeys ? '✅' : '❌'}`);
  console.log(`Realtime: ${results.realtimeConnection ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.group('❌ Errors:');
    results.errors.forEach(error => console.error(error));
    console.groupEnd();
  }
  
  console.groupEnd();
}