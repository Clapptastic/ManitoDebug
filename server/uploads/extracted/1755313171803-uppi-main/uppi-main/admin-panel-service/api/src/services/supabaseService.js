const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

let supabase = null;

function initializeSupabase() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.SUPABASE_URL || config.supabase?.url;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || config.supabase?.anonKey;
  
  if (!supabaseUrl || !supabaseKey) {
    logger.warn('Supabase URL or Key not provided, using fallback configuration');
    return null;
  }
  
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side, don't persist sessions
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-admin-panel-service': '1.0.0'
        }
      }
    });
    
    logger.info('Supabase client initialized successfully');
    return supabase;
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Initialize on module load
initializeSupabase();

// Health check function
async function checkSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase client not initialized' };
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

// Utility functions for common operations
async function executeRPC(functionName, params = {}) {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase.rpc(functionName, params);
  if (error) throw error;
  return data;
}

async function logActivity(userId, action, details = {}) {
  if (!supabase) return;
  
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: details.resourceType || 'system',
      resource_id: details.resourceId,
      old_values: details.oldValues,
      new_values: details.newValues,
      ip_address: details.ipAddress,
      user_agent: details.userAgent,
      metadata: details.metadata || {}
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
}

async function recordApiUsage(data) {
  if (!supabase) return;
  
  try {
    await supabase.from('api_usage_metrics').insert({
      user_id: data.userId,
      endpoint: data.endpoint,
      method: data.method,
      status_code: data.statusCode,
      response_time_ms: data.responseTime,
      request_size_bytes: data.requestSize,
      response_size_bytes: data.responseSize,
      user_agent: data.userAgent,
      ip_address: data.ipAddress,
      api_key_id: data.apiKeyId,
      metadata: data.metadata || {}
    });
  } catch (error) {
    logger.error('Failed to record API usage:', error);
  }
}

async function logError(errorData) {
  if (!supabase) return;
  
  try {
    await supabase.from('error_logs').insert({
      user_id: errorData.userId,
      error_type: errorData.type,
      error_message: errorData.message,
      error_stack: errorData.stack,
      component: errorData.component,
      action: errorData.action,
      severity: errorData.severity || 'medium',
      environment: errorData.environment || process.env.NODE_ENV || 'development',
      user_agent: errorData.userAgent,
      url: errorData.url,
      metadata: errorData.metadata || {}
    });
  } catch (error) {
    logger.error('Failed to log error:', error);
  }
}

async function getFeatureFlag(name, userId = null, defaultValue = false) {
  if (!supabase) return defaultValue;
  
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('name', name)
      .eq('is_enabled', true)
      .single();
    
    if (error || !data) return defaultValue;
    
    // Check rollout percentage
    if (data.rollout_percentage < 100) {
      if (userId) {
        // Deterministic rollout based on user ID
        const hash = require('crypto')
          .createHash('md5')
          .update(userId + name)
          .digest('hex');
        const hashNumber = parseInt(hash.substr(0, 8), 16);
        const percentage = hashNumber % 100;
        
        if (percentage >= data.rollout_percentage) {
          return defaultValue;
        }
      } else {
        // Random rollout for anonymous users
        if (Math.random() * 100 >= data.rollout_percentage) {
          return defaultValue;
        }
      }
    }
    
    // Check target users
    if (data.target_users && data.target_users.length > 0) {
      if (!userId || !data.target_users.includes(userId)) {
        return defaultValue;
      }
    }
    
    return data.is_enabled;
  } catch (error) {
    logger.error('Failed to get feature flag:', error);
    return defaultValue;
  }
}

async function recordSystemHealth(metrics) {
  if (!supabase) return;
  
  try {
    await supabase.from('system_health_metrics').insert({
      cpu_usage: metrics.cpuUsage,
      memory_usage: metrics.memoryUsage,
      disk_usage: metrics.diskUsage,
      database_connections: metrics.dbConnections,
      active_users: metrics.activeUsers,
      api_response_time: metrics.apiResponseTime,
      error_rate: metrics.errorRate,
      uptime_seconds: metrics.uptimeSeconds,
      metadata: metrics.metadata || {}
    });
  } catch (error) {
    logger.error('Failed to record system health:', error);
  }
}

// Authentication helpers
async function verifyApiKey(apiKey) {
  if (!supabase || !apiKey) return null;
  
  try {
    const keyHash = require('crypto')
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();
    
    if (error || !data) return null;
    
    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }
    
    // Update last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    
    return data;
  } catch (error) {
    logger.error('Failed to verify API key:', error);
    return null;
  }
}

async function getUserFromToken(token) {
  if (!supabase || !token) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    
    // Get additional profile information
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { ...user, profile };
  } catch (error) {
    logger.error('Failed to get user from token:', error);
    return null;
  }
}

module.exports = {
  supabase,
  checkSupabaseConnection,
  executeRPC,
  logActivity,
  recordApiUsage,
  logError,
  getFeatureFlag,
  recordSystemHealth,
  verifyApiKey,
  getUserFromToken,
  initializeSupabase
};