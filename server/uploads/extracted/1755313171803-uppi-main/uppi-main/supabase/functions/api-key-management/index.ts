/**
 * SECURE API KEY MANAGEMENT EDGE FUNCTION
 * Enhanced with comprehensive security features
 */

import { createSecurityUtils, handleSecurityError } from '../_shared/security-utils.ts';

const security = createSecurityUtils();

interface ApiKeyRotationRequest {
  keyId: string;
  newKey: string;
  provider: string;
}

interface ApiKeyUsageRequest {
  keyId: string;
  startDate?: string;
  endDate?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return security.handleCORS();
  }

  try {
    // Comprehensive security validation
    const securityContext = await security.validateRequest(req);

    // Require authentication for this endpoint
    if (!securityContext.isAuthenticated) {
      throw new Error('SECURITY_AUTHENTICATION_FAILED');
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Route handling with security checks
    if (method === 'POST' && path.includes('/rotate')) {
      return await handleKeyRotation(req, securityContext);
    } else if (method === 'GET' && path.includes('/usage')) {
      return await handleUsageTracking(req, securityContext);
    } else if (method === 'POST' && path.includes('/validate')) {
      return await handleKeyValidation(req, securityContext);
    } else if (method === 'DELETE' && path.includes('/revoke')) {
      return await handleKeyRevocation(req, securityContext);
    } else if (method === 'GET' && path.includes('/audit')) {
      return await handleAuditLog(req, securityContext);
    } else {
      return security.createSecureResponse({
        error: 'Invalid endpoint'
      }, 404);
    }

  } catch (error) {
    console.error('API Key Management Error:', error);
    return handleSecurityError(error);
  }
});

/**
 * Handle API key rotation with security checks
 */
async function handleKeyRotation(req: Request, context: any): Promise<Response> {
  try {
    const body = await req.json();
    const { keyId, newKey, provider } = body as ApiKeyRotationRequest;

    // Sanitize input
    const sanitizedData = security.sanitizeInput(body, ['keyId', 'newKey', 'provider']);

    // Validate API key ownership
    const canAccess = await security.validateApiKeyAccess(keyId, 'key_rotation');
    if (!canAccess) {
      throw new Error('SECURITY_AUTHORIZATION_FAILED');
    }

    // Generate key hash and masked version
    const keyHash = await hashApiKey(newKey);
    const maskedKey = maskApiKey(newKey);
    const keyPrefix = newKey.substring(0, 4);

    // Update the key using the secure database function
    const supabase = createSecurityUtils()['supabase'];
    const { data, error } = await supabase.rpc('manage_api_key', {
      operation: 'insert',
      user_id_param: context.user.id,
      provider_param: provider,
      api_key_param: newKey,
      key_hash_param: keyHash,
      masked_key_param: maskedKey,
      key_prefix_param: keyPrefix
    });

    if (error) {
      throw new Error(`Key rotation failed: ${error.message}`);
    }

    return security.createSecureResponse({
      success: true,
      message: 'API key rotated successfully',
      keyId: data.id,
      maskedKey: data.masked_key,
      rotatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Key rotation error:', error);
    throw error;
  }
}

/**
 * Handle API key usage tracking
 */
async function handleUsageTracking(req: Request, context: any): Promise<Response> {
  try {
    const url = new URL(req.url);
    const keyId = url.searchParams.get('keyId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!keyId) {
      return security.createSecureResponse({
        error: 'Key ID required'
      }, 400);
    }

    // Validate API key ownership
    const canAccess = await security.validateApiKeyAccess(keyId, 'usage_tracking');
    if (!canAccess) {
      throw new Error('SECURITY_AUTHORIZATION_FAILED');
    }

    const supabase = createSecurityUtils()['supabase'];
    
    // Build query with date filters
    let query = supabase
      .from('api_usage_costs')
      .select('*')
      .eq('user_id', context.user.id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: usageData, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`Usage tracking failed: ${error.message}`);
    }

    // Calculate usage statistics
    const totalUsage = usageData?.length || 0;
    const totalCost = usageData?.reduce((sum, record) => sum + (Number(record.cost_usd) || 0), 0) || 0;
    const successfulRequests = usageData?.filter(record => record.success).length || 0;

    return security.createSecureResponse({
      usage: {
        totalRequests: totalUsage,
        successfulRequests,
        failedRequests: totalUsage - successfulRequests,
        totalCost: Number(totalCost.toFixed(4)),
        period: {
          startDate: startDate || 'all',
          endDate: endDate || 'all'
        }
      },
      details: usageData?.slice(0, 100) || [] // Limit details to last 100
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    throw error;
  }
}

/**
 * Handle API key validation
 */
async function handleKeyValidation(req: Request, context: any): Promise<Response> {
  try {
    const body = await req.json();
    const { keyId } = body;

    if (!keyId) {
      return security.createSecureResponse({
        error: 'Key ID required'
      }, 400);
    }

    const supabase = createSecurityUtils()['supabase'];
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('id, provider, status, is_active, created_at, last_used_at, last_validated')
      .eq('id', keyId)
      .eq('user_id', context.user.id)
      .single();

    if (error || !keyData) {
      return security.createSecureResponse({
        valid: false,
        error: 'API key not found'
      }, 404);
    }

    // Update last_validated timestamp
    await supabase
      .from('api_keys')
      .update({ 
        last_validated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    return security.createSecureResponse({
      valid: keyData.is_active && keyData.status === 'active',
      keyInfo: {
        id: keyData.id,
        provider: keyData.provider,
        status: keyData.status,
        isActive: keyData.is_active,
        createdAt: keyData.created_at,
        lastUsed: keyData.last_used_at,
        lastValidated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Key validation error:', error);
    throw error;
  }
}

/**
 * Handle API key revocation
 */
async function handleKeyRevocation(req: Request, context: any): Promise<Response> {
  try {
    const body = await req.json();
    const { keyId, reason } = body;

    if (!keyId) {
      return security.createSecureResponse({
        error: 'Key ID required'
      }, 400);
    }

    const supabase = createSecurityUtils()['supabase'];
    
    // Soft delete by deactivating the key
    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId)
      .eq('user_id', context.user.id);

    if (error) {
      throw new Error(`Key revocation failed: ${error.message}`);
    }

    // Log the revocation
    await supabase.rpc('log_security_event', {
      user_id_param: context.user.id,
      event_type: 'api_key_revoked',
      resource_type: 'api_keys',
      resource_id: keyId,
      metadata_param: {
        reason: reason || 'Manual revocation',
        revoked_by: context.user.id,
        revoked_at: new Date().toISOString()
      }
    });

    return security.createSecureResponse({
      success: true,
      message: 'API key revoked successfully',
      revokedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Key revocation error:', error);
    throw error;
  }
}

/**
 * Handle audit log requests
 */
async function handleAuditLog(req: Request, context: any): Promise<Response> {
  try {
    // Only admins can access full audit logs
    if (!context.isAdmin) {
      throw new Error('SECURITY_AUTHORIZATION_FAILED');
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const supabase = createSecurityUtils()['supabase'];
    const { data: auditData, error } = await supabase
      .from('audit_logs')
      .select('*')
      .or('action.like.%api_key%,resource_type.eq.api_keys')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Audit log fetch failed: ${error.message}`);
    }

    return security.createSecureResponse({
      audit: auditData || [],
      pagination: {
        limit,
        offset,
        total: auditData?.length || 0
      }
    });

  } catch (error) {
    console.error('Audit log error:', error);
    throw error;
  }
}

/**
 * Hash API key for secure storage
 */
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create masked version of API key
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }
  return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
}