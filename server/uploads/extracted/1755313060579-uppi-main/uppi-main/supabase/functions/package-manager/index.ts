import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PackageInfo {
  name: string;
  current_version: string;
  latest_version: string;
  security_vulnerabilities: number;
  update_available: boolean;
  breaking_changes: boolean;
}

interface SecurityVulnerability {
  id: string;
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  fix_version: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, packages } = await req.json();

    // Authenticate and authorize: super_admin only
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id_param: user.id });
    if (roleData !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: super_admin required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Package manager action: ${action}`);

    let result = {};

    switch (action) {
      case 'scan':
        result = await scanPackages();
        break;
      case 'update':
        result = await updatePackages(packages);
        break;
      case 'security_scan':
        result = await securityScan();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        ...result,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in package-manager function:', error);
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

async function scanPackages(): Promise<any> {
  console.log('Scanning packages for updates...');
  
  // Simulate package scanning
  const packages: PackageInfo[] = [
    {
      name: '@supabase/supabase-js',
      current_version: '2.49.4',
      latest_version: '2.50.0',
      security_vulnerabilities: 0,
      update_available: true,
      breaking_changes: false
    },
    {
      name: 'react',
      current_version: '18.3.1',
      latest_version: '18.3.2',
      security_vulnerabilities: 1,
      update_available: true,
      breaking_changes: false
    },
    {
      name: '@types/jest',
      current_version: '29.5.14',
      latest_version: '30.0.0',
      security_vulnerabilities: 0,
      update_available: true,
      breaking_changes: true
    },
    {
      name: 'lodash',
      current_version: '4.17.21',
      latest_version: '4.17.21',
      security_vulnerabilities: 2,
      update_available: false,
      breaking_changes: false
    }
  ];

  const summary = {
    total_packages: packages.length,
    updates_available: packages.filter(p => p.update_available).length,
    security_issues: packages.reduce((sum, p) => sum + p.security_vulnerabilities, 0),
    breaking_updates: packages.filter(p => p.update_available && p.breaking_changes).length
  };

  return {
    packages,
    summary
  };
}

async function updatePackages(packageNames: string[]): Promise<any> {
  console.log(`Updating packages: ${packageNames.join(', ')}`);
  
  // Simulate package updates
  const updates = packageNames.map(name => ({
    package: name,
    status: Math.random() > 0.1 ? 'success' : 'failed',
    old_version: '1.0.0',
    new_version: '1.1.0',
    duration_ms: Math.floor(Math.random() * 5000) + 1000
  }));

  const successful = updates.filter(u => u.status === 'success').length;
  const failed = updates.filter(u => u.status === 'failed').length;

  return {
    updates,
    summary: {
      total: updates.length,
      successful,
      failed,
      total_duration_ms: updates.reduce((sum, u) => sum + u.duration_ms, 0)
    }
  };
}

async function securityScan(): Promise<any> {
  console.log('Scanning for security vulnerabilities...');
  
  const vulnerabilities: SecurityVulnerability[] = [
    {
      id: 'CVE-2024-1234',
      package: 'react',
      severity: 'moderate',
      title: 'Cross-site Scripting in React DevTools',
      description: 'A potential XSS vulnerability in React DevTools extension',
      fix_version: '18.3.2'
    },
    {
      id: 'CVE-2023-5678',
      package: 'lodash',
      severity: 'high',
      title: 'Prototype Pollution in lodash',
      description: 'Prototype pollution vulnerability in lodash merge function',
      fix_version: '4.17.22'
    },
    {
      id: 'CVE-2023-9012',
      package: 'lodash',
      severity: 'high',
      title: 'Command Injection in lodash',
      description: 'Command injection vulnerability in lodash template function',
      fix_version: '4.17.22'
    }
  ];

  const summary = {
    total_vulnerabilities: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    packages_affected: new Set(vulnerabilities.map(v => v.package)).size
  };

  return {
    vulnerabilities,
    summary
  };
}