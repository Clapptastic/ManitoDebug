import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityScanRequest {
  scan_type: 'comprehensive' | 'rls' | 'api_keys' | 'compliance';
  target?: string;
}

interface SecurityIssue {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  detected_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { scan_type, target }: SecurityScanRequest = await req.json();

    console.log(`Starting security scan: ${scan_type}`);

    const issues: SecurityIssue[] = [];
    const metrics = {
      overall_score: 0,
      vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
      compliance: { gdpr: 0, soc2: 0, iso27001: 0 }
    };

    // Perform RLS policy checks
    if (scan_type === 'comprehensive' || scan_type === 'rls') {
      console.log('Checking RLS policies...');
      
      try {
        const { data: tables } = await supabaseClient.rpc('exec_sql', {
          sql: `
            SELECT schemaname, tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public'
          `
        });

        if (tables && tables.result) {
          // Check for tables without RLS enabled
          const tablesData = tables.result.tables || [];
          tablesData.forEach((table: any) => {
            if (!table.rowsecurity) {
              issues.push({
                id: `rls-${table.tablename}`,
                category: 'authorization',
                severity: 'critical',
                title: `RLS not enabled on table: ${table.tablename}`,
                description: `Table ${table.tablename} does not have Row Level Security enabled`,
                recommendation: `Enable RLS: ALTER TABLE ${table.tablename} ENABLE ROW LEVEL SECURITY`,
                detected_at: new Date().toISOString()
              });
              metrics.vulnerabilities.critical++;
            }
          });
        }
      } catch (error) {
        console.error('RLS check error:', error);
      }
    }

    // Check API key security
    if (scan_type === 'comprehensive' || scan_type === 'api_keys') {
      console.log('Checking API key security...');
      
      try {
        const { data: apiKeys } = await supabaseClient
          .from('api_keys')
          .select('id, masked_key, created_at, last_used_at, status')
          .limit(100);

        if (apiKeys) {
          // Check for old or unused API keys
          const oldKeyThreshold = new Date();
          oldKeyThreshold.setMonth(oldKeyThreshold.getMonth() - 6);

          apiKeys.forEach(key => {
            const lastUsed = key.last_used_at ? new Date(key.last_used_at) : new Date(key.created_at);
            if (lastUsed < oldKeyThreshold) {
              issues.push({
                id: `api-key-${key.id}`,
                category: 'data',
                severity: 'medium',
                title: 'Unused API key detected',
                description: `API key ${key.masked_key} has not been used in over 6 months`,
                recommendation: 'Review and remove unused API keys to reduce attack surface',
                detected_at: new Date().toISOString()
              });
              metrics.vulnerabilities.medium++;
            }
          });
        }
      } catch (error) {
        console.error('API key check error:', error);
      }
    }

    // Compliance checks
    if (scan_type === 'comprehensive' || scan_type === 'compliance') {
      console.log('Checking compliance...');
      
      // GDPR compliance checks
      const gdprScore = await checkGDPRCompliance(supabaseClient);
      metrics.compliance.gdpr = gdprScore;

      if (gdprScore < 80) {
        issues.push({
          id: 'gdpr-compliance',
          category: 'compliance',
          severity: 'high',
          title: 'GDPR compliance below threshold',
          description: `GDPR compliance score is ${gdprScore}%, below the 80% threshold`,
          recommendation: 'Review data processing consent, deletion procedures, and export capabilities',
          detected_at: new Date().toISOString()
        });
        metrics.vulnerabilities.high++;
      }
    }

    // Calculate overall security score
    const totalIssues = metrics.vulnerabilities.critical + metrics.vulnerabilities.high + 
                       metrics.vulnerabilities.medium + metrics.vulnerabilities.low;
    
    // Base score of 100, deduct points for issues
    metrics.overall_score = Math.max(0, 100 - (
      metrics.vulnerabilities.critical * 20 +
      metrics.vulnerabilities.high * 10 +
      metrics.vulnerabilities.medium * 5 +
      metrics.vulnerabilities.low * 2
    ));

    console.log(`Security scan completed. Found ${totalIssues} issues.`);

    return new Response(
      JSON.stringify({
        success: true,
        scan_type,
        metrics,
        issues,
        scanned_at: new Date().toISOString(),
        summary: {
          total_issues: totalIssues,
          critical_issues: metrics.vulnerabilities.critical,
          recommendations: issues.filter(i => i.severity === 'critical').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in security-audit function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkGDPRCompliance(supabaseClient: any): Promise<number> {
  let score = 100;
  
  try {
    // Check for data deletion policies
    const { data: deletionRequests } = await supabaseClient
      .from('account_deletion_requests')
      .select('count()')
      .limit(1);
    
    if (!deletionRequests) {
      score -= 20; // No deletion mechanism
    }

    // Check for audit logging
    const { data: auditLogs } = await supabaseClient
      .from('admin_audit_log')
      .select('count()')
      .limit(1);
    
    if (!auditLogs) {
      score -= 15; // No audit logging
    }

    // Additional checks would go here...
    
  } catch (error) {
    console.error('GDPR compliance check error:', error);
    score -= 10; // Deduct for inability to check
  }
  
  return Math.max(0, score);
}