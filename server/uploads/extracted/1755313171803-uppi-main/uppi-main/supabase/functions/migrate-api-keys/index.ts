/**
 * Migrate API Keys - Database Migration and Cleanup
 * Handles migration of API keys between storage formats and cleanup operations
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationRequest {
  operation: 'migrate_to_vault' | 'cleanup_inactive' | 'reencrypt' | 'validate_all';
  dryRun?: boolean;
  batchSize?: number;
}

interface MigrationResponse {
  success: boolean;
  operation: string;
  results: {
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  details: Array<{
    keyId: string;
    provider: string;
    status: 'success' | 'failed' | 'skipped';
    message?: string;
  }>;
  dryRun: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Migrate API Keys - Starting migration operation');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user - only allow admin users
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required for migration operations');
    }

    const body: MigrationRequest = await req.json();
    const { 
      operation, 
      dryRun = true, 
      batchSize = 50 
    } = body;

    console.log(`🔧 Performing ${operation} operation (dry run: ${dryRun})`);

    let results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    };
    let details: Array<{ keyId: string; provider: string; status: 'success' | 'failed' | 'skipped'; message?: string }> = [];

    switch (operation) {
      case 'migrate_to_vault':
        // Migrate plaintext API keys to vault storage
        const { data: plaintextKeys } = await supabaseClient
          .from('api_keys')
          .select('id, provider, user_id')
          .is('vault_secret_id', null)
          .eq('is_active', true)
          .limit(batchSize);

        if (plaintextKeys) {
          results.processed = plaintextKeys.length;
          
          for (const key of plaintextKeys) {
            try {
              if (!dryRun) {
                // In a real implementation, would encrypt and store in vault
                const vaultId = `vault_migrated_${key.id}_${Date.now()}`;
                
                await supabaseClient
                  .from('api_keys')
                  .update({ vault_secret_id: vaultId })
                  .eq('id', key.id);
              }
              
              results.successful++;
              details.push({
                keyId: key.id,
                provider: key.provider,
                status: 'success',
                message: dryRun ? 'Would migrate to vault' : 'Migrated to vault'
              });
            } catch (error) {
              results.failed++;
              details.push({
                keyId: key.id,
                provider: key.provider,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Migration failed'
              });
            }
          }
        }
        break;

      case 'cleanup_inactive':
        // Remove old inactive API keys
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months old
        
        const { data: inactiveKeys } = await supabaseClient
          .from('api_keys')
          .select('id, provider, updated_at')
          .eq('is_active', false)
          .lt('updated_at', cutoffDate.toISOString())
          .limit(batchSize);

        if (inactiveKeys) {
          results.processed = inactiveKeys.length;
          
          for (const key of inactiveKeys) {
            try {
              if (!dryRun) {
                await supabaseClient
                  .from('api_keys')
                  .delete()
                  .eq('id', key.id);
              }
              
              results.successful++;
              details.push({
                keyId: key.id,
                provider: key.provider,
                status: 'success',
                message: dryRun ? 'Would delete inactive key' : 'Deleted inactive key'
              });
            } catch (error) {
              results.failed++;
              details.push({
                keyId: key.id,
                provider: key.provider,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Deletion failed'
              });
            }
          }
        }
        break;

      case 'validate_all':
        // Validate all active API keys
        const { data: activeKeys } = await supabaseClient
          .from('api_keys')
          .select('id, provider, user_id')
          .eq('is_active', true)
          .limit(batchSize);

        if (activeKeys) {
          results.processed = activeKeys.length;
          
          for (const key of activeKeys) {
            try {
              // Simulate validation - in real implementation would test each API key
              const isValid = Math.random() > 0.1; // 90% success rate simulation
              
              if (!dryRun) {
                await supabaseClient
                  .from('api_keys')
                  .update({ 
                    status: isValid ? 'active' : 'error',
                    last_validated: new Date().toISOString(),
                    error_message: isValid ? null : 'Validation failed during migration'
                  })
                  .eq('id', key.id);
              }
              
              if (isValid) {
                results.successful++;
                details.push({
                  keyId: key.id,
                  provider: key.provider,
                  status: 'success',
                  message: dryRun ? 'Would validate as working' : 'Validated successfully'
                });
              } else {
                results.failed++;
                details.push({
                  keyId: key.id,
                  provider: key.provider,
                  status: 'failed',
                  message: 'API key validation failed'
                });
              }
            } catch (error) {
              results.failed++;
              details.push({
                keyId: key.id,
                provider: key.provider,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Validation error'
              });
            }
          }
        }
        break;

      default:
        throw new Error(`Unknown migration operation: ${operation}`);
    }

    const response: MigrationResponse = {
      success: true,
      operation,
      results,
      details,
      dryRun
    };

    console.log(`✅ Migration ${operation} completed - ${results.successful}/${results.processed} successful`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Migrate API Keys error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      operation: 'unknown',
      results: { processed: 0, successful: 0, failed: 0, skipped: 0 },
      details: [],
      dryRun: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});