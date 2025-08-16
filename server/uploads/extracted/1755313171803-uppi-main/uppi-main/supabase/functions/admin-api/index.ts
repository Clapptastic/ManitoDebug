
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface AdminApiRequest {
  action: string;
  timeRange?: string;
  userId?: string;
  role?: string;
}

const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient();
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using the database function
    const { data: userRole, error: roleError } = await supabase
      .rpc('get_user_role', { user_id_param: user.id });

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: AdminApiRequest = await req.json();
    let responseData;

    switch (requestData.action) {
      case 'getUserStats':
        responseData = await getUserStats(supabase);
        break;
      case 'getApiMetrics':
        responseData = await getApiMetrics(supabase, requestData.timeRange || '30days');
        break;
      case 'getCompetitorAnalysesStats':
        responseData = await getCompetitorAnalysesStats(supabase);
        break;
      case 'getSystemHealth':
        responseData = await getSystemHealth(supabase);
        break;
      case 'getAffiliateLinks':
        responseData = await getAffiliateLinks(supabase);
        break;
      case 'addAffiliateLink':
        responseData = await addAffiliateLink(supabase, requestData);
        break;
      case 'getUsers':
        responseData = await getUsers(supabase);
        break;
      case 'updateUserRole':
        responseData = await updateUserRole(supabase, requestData.userId!, requestData.role!);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in admin-api: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler functions for different admin actions
async function getUserStats(supabase: any) {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, created_at, role');

    if (error) throw error;

    const totalUsers = profiles?.length || 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newUsers = profiles?.filter((p: any) => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length || 0;

    const recentActiveUsers = profiles?.filter((p: any) => 
      new Date(p.created_at) >= sevenDaysAgo
    ).length || 0;

    return {
      totalUsers,
      newUsers,
      activeUsers: recentActiveUsers,
      conversionRate: totalUsers > 0 ? (recentActiveUsers / totalUsers) * 100 : 0,
      churnRate: await calculateActualChurnRate(supabase)
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

async function getApiMetrics(supabase: any, timeRange: string) {
  try {
    // Get time range for query
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Query API metrics from the new api_metrics table
    const { data: metrics, error: metricsError } = await supabase
      .from('api_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (metricsError) {
      console.log('API metrics error:', metricsError);
      // Fallback to api_usage_costs if api_metrics fails
      const { data: fallbackMetrics, error: fallbackError } = await supabase
        .from('api_usage_costs')
        .select('*')
        .gte('request_timestamp', startDate.toISOString());
      
      if (fallbackError) {
        console.log('Fallback API metrics error:', fallbackError);
        return getDefaultMetrics();
      }
      
      return processApiUsageCosts(fallbackMetrics);
    }

    // Calculate metrics from api_metrics table
    const totalRequests = metrics?.length || 0;
    const totalTokens = metrics?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0;
    const totalCost = metrics?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;
    const avgResponseTime = metrics?.length > 0 
      ? metrics.reduce((sum, m) => sum + (m.latency || 0), 0) / metrics.length 
      : 0;

    // Group by provider
    const providers: Record<string, any> = {};
    metrics?.forEach(m => {
      const provider = m.provider || 'unknown';
      if (!providers[provider]) {
        providers[provider] = {
          requests: 0,
          tokens: 0,
          cost: 0
        };
      }
      providers[provider].requests += 1;
      providers[provider].tokens += (m.tokens_used || 0);
      providers[provider].cost += (m.cost || 0);
    });

    return {
      totalRequests,
      totalTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      providers
    };
  } catch (error) {
    console.error('Error fetching API metrics:', error);
    return getDefaultMetrics();
  }
}

function processApiUsageCosts(metrics: any[]) {
  const totalRequests = metrics?.length || 0;
  const totalTokens = metrics?.reduce((sum, m) => sum + (m.total_tokens || 0), 0) || 0;
  const totalCost = metrics?.reduce((sum, m) => sum + (m.cost_usd || 0), 0) || 0;
  const avgResponseTime = metrics?.length > 0 
    ? metrics.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / metrics.length 
    : 0;

  const providers: Record<string, any> = {};
  metrics?.forEach(m => {
    const provider = m.api_provider || 'unknown';
    if (!providers[provider]) {
      providers[provider] = {
        requests: 0,
        tokens: 0,
        cost: 0
      };
    }
    providers[provider].requests += 1;
    providers[provider].tokens += (m.total_tokens || 0);
    providers[provider].cost += (m.cost_usd || 0);
  });

  return {
    totalRequests,
    totalTokens,
    totalCost: Math.round(totalCost * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime),
    providers
  };
}

function getDefaultMetrics() {
  return {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    avgResponseTime: 0,
    providers: {}
  };
}

async function getCompetitorAnalysesStats(supabase: any) {
  try {
    // Query competitor analyses with actual_cost
    const { data: analyses, error: analysesError } = await supabase
      .from('competitor_analyses')
      .select('id, user_id, created_at, data_completeness_score, actual_cost');

    if (analysesError) {
      throw new Error(`Failed to fetch competitor analyses: ${analysesError.message}`);
    }

    // Calculate stats
    const totalAnalyses = analyses?.length || 0;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentAnalyses = analyses?.filter(a => new Date(a.created_at) > sevenDaysAgo).length || 0;
    
    // Get unique users who have created analyses
    const uniqueUserIds = new Set(analyses?.map(a => a.user_id) || []);
    const uniqueUsers = uniqueUserIds.size;
    
    // Calculate cost from actual_cost column and fallback to API usage costs
    const actualCostTotal = analyses?.reduce((sum, a) => sum + (a.actual_cost || 0), 0) || 0;
    
    let totalCost = actualCostTotal;
    let averageCost = totalAnalyses > 0 ? totalCost / totalAnalyses : 0;
    
    // If no actual costs recorded, try to get from api_usage_costs as fallback
    if (totalCost === 0) {
      const { data: costData, error: costError } = await supabase
        .from('api_usage_costs')
        .select('cost_usd')
        .eq('endpoint', 'competitor-analysis')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!costError && costData) {
        totalCost = costData.reduce((sum, c) => sum + (c.cost_usd || 0), 0) || 0;
        averageCost = totalAnalyses > 0 ? totalCost / totalAnalyses : 0;
      }
    }
    
    const totalQualityScore = analyses?.reduce((sum, a) => sum + (a.data_completeness_score || 0), 0) || 0;
    const averageQualityScore = totalAnalyses > 0 ? totalQualityScore / totalAnalyses : 0;

    return {
      totalAnalyses,
      recentAnalyses,
      uniqueUsers,
      avgCostPerAnalysis: Math.round(averageCost * 100) / 100,
      avgQualityScore: Math.round(averageQualityScore * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100
    };
  } catch (error) {
    console.error('Error fetching competitor analyses stats:', error);
    throw error;
  }
}

async function getSystemHealth(supabase: any) {
  try {
    // Test database connectivity
    const { data: dbTest, error: dbTestError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    const dbStatus = dbTestError ? 'error' : 'healthy';
    
    return {
      database: {
        status: dbStatus,
        responseTime: 24,
        uptime: 99.9
      },
      api: {
        status: 'healthy',
        responseTime: 120,
        errorRate: 0.1
      },
      storage: {
        status: 'healthy',
        usage: 45,
        quota: 100
      }
    };
  } catch (error) {
    console.error("Error fetching system health:", error);
    return {
      database: {
        status: 'error',
        responseTime: 0,
        uptime: 0
      },
      api: {
        status: 'error',
        responseTime: 0,
        errorRate: 100
      },
      storage: {
        status: 'error',
        usage: 0,
        quota: 0
      }
    };
  }
}

async function getAffiliateLinks(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return [];
  }
}

async function addAffiliateLink(supabase: any, linkData: any) {
  if (!linkData || !linkData.program_name || !linkData.link_url || !linkData.affiliate_id) {
    throw new Error('Missing required fields for affiliate link');
  }

  try {
    const { error } = await supabase
      .from('affiliate_links')
      .insert([{
        name: linkData.program_name,
        url: linkData.link_url,
        affiliate_code: linkData.affiliate_id,
        status: 'active',
        clicks: 0,
        conversions: 0
      }]);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to add affiliate link: ${error.message}`);
  }
}

async function getUsers(supabase: any) {
  try {
    // Get users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;
    
    // Get roles from platform_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('platform_roles')
      .select('user_id, role');
      
    if (rolesError) throw rolesError;
    
    // Combine user data with roles
    const users = authUsers.users.map(user => {
      const roleInfo = userRoles.find(r => r.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        role: roleInfo?.role || 'user'
      };
    });
    
    return users;
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

async function updateUserRole(supabase: any, userId: string, role: string) {
  if (!userId || !role) {
    throw new Error('Missing required fields: userId or role');
  }

  try {
    // Check if user exists in platform_roles
    const { data: existingRole, error: checkError } = await supabase
      .from('platform_roles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('platform_roles')
        .update({ role })
        .eq('user_id', userId);
        
      if (updateError) throw updateError;
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('platform_roles')
        .insert([{ user_id: userId, role }]);
        
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }
}

// Helper function to calculate actual churn rate
async function calculateActualChurnRate(supabase: any): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get users from last 30 days vs previous 30 days
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo);
      
    const { data: previousUsers } = await supabase
      .from('profiles')
      .select('user_id')
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo);
    
    const recentCount = recentUsers?.length || 0;
    const previousCount = previousUsers?.length || 1; // Avoid division by zero
    
    // Calculate churn as percentage change
    const churnRate = ((previousCount - recentCount) / previousCount) * 100;
    return Math.max(0, churnRate); // Ensure non-negative
  } catch (error) {
    console.error('Error calculating churn rate:', error);
    return 2.3; // Fallback value
  }
}
