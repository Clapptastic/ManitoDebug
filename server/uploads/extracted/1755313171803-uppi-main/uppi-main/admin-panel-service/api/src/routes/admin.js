const express = require('express');
const router = express.Router();
const { supabase, logActivity } = require('../services/supabaseService');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    await logActivity(req.user.id, 'users.list', {
      resourceType: 'users',
      metadata: { page, limit, search, count }
    });
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Admin, Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/users/:id', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, metadata } = req.body;
    
    // Get current user data for audit log
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        role,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logActivity(req.user.id, 'users.update', {
      resourceType: 'users',
      resourceId: id,
      oldValues: currentUser,
      newValues: data
    });
    
    res.json({
      success: true,
      data,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get admin analytics
 *     tags: [Admin, Analytics]
 */
router.get('/analytics', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    // Get various analytics
    const [
      usersResult,
      apiUsageResult,
      errorsResult,
      healthResult
    ] = await Promise.all([
      // User statistics
      supabase
        .from('profiles')
        .select('id, created_at, role')
        .gte('created_at', startDate.toISOString()),
      
      // API usage statistics
      supabase
        .from('api_usage_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString()),
      
      // Error statistics
      supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', startDate.toISOString()),
      
      // System health
      supabase
        .from('system_health_metrics')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false })
    ]);
    
    const analytics = {
      users: {
        total: usersResult.data?.length || 0,
        byRole: usersResult.data?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}) || {},
        growth: usersResult.data?.length || 0
      },
      api: {
        totalRequests: apiUsageResult.data?.length || 0,
        averageResponseTime: apiUsageResult.data?.reduce((acc, req) => acc + (req.response_time_ms || 0), 0) / (apiUsageResult.data?.length || 1),
        statusCodes: apiUsageResult.data?.reduce((acc, req) => {
          const code = Math.floor(req.status_code / 100) * 100;
          acc[`${code}xx`] = (acc[`${code}xx`] || 0) + 1;
          return acc;
        }, {}) || {},
        topEndpoints: apiUsageResult.data?.reduce((acc, req) => {
          acc[req.endpoint] = (acc[req.endpoint] || 0) + 1;
          return acc;
        }, {}) || {}
      },
      errors: {
        total: errorsResult.data?.length || 0,
        bySeverity: errorsResult.data?.reduce((acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        }, {}) || {},
        resolved: errorsResult.data?.filter(error => error.resolved_at).length || 0
      },
      system: {
        latestHealth: healthResult.data?.[0] || null,
        averageMetrics: healthResult.data?.length > 0 ? {
          cpuUsage: healthResult.data.reduce((acc, h) => acc + (h.cpu_usage || 0), 0) / healthResult.data.length,
          memoryUsage: healthResult.data.reduce((acc, h) => acc + (h.memory_usage || 0), 0) / healthResult.data.length,
          responseTime: healthResult.data.reduce((acc, h) => acc + (h.api_response_time || 0), 0) / healthResult.data.length
        } : null
      }
    };
    
    await logActivity(req.user.id, 'analytics.view', {
      resourceType: 'analytics',
      metadata: { timeRange }
    });
    
    res.json({
      success: true,
      data: analytics,
      timeRange,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/api-keys:
 *   get:
 *     summary: Get API keys
 *     tags: [Admin, API Keys]
 */
router.get('/api-keys', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, permissions, is_active, expires_at, last_used_at, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/api-keys:
 *   post:
 *     summary: Create API key
 *     tags: [Admin, API Keys]
 */
router.post('/api-keys', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { name, permissions, expiresAt } = req.body;
    
    // Generate API key
    const crypto = require('crypto');
    const apiKey = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 8) + '...';
    
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: permissions || [],
        user_id: req.user.id,
        expires_at: expiresAt
      })
      .select()
      .single();
    
    if (error) throw error;
    
    await logActivity(req.user.id, 'api_keys.create', {
      resourceType: 'api_keys',
      resourceId: data.id,
      newValues: { name, permissions }
    });
    
    res.json({
      success: true,
      data: {
        ...data,
        key: apiKey // Return the actual key only once
      },
      message: 'API key created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create API key',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/error-logs:
 *   get:
 *     summary: Get error logs
 *     tags: [Admin, Error Logs]
 */
router.get('/error-logs', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, severity } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('error_logs')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/error-logs/{id}/resolve:
 *   put:
 *     summary: Resolve error log
 *     tags: [Admin, Error Logs]
 */
router.put('/error-logs/:id/resolve', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    
    const { data, error } = await supabase
      .from('error_logs')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: req.user.id,
        resolution_notes: resolution
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    await logActivity(req.user.id, 'error_logs.resolve', {
      resourceType: 'error_logs',
      resourceId: id,
      newValues: { resolved: true, resolution }
    });
    
    res.json({
      success: true,
      data,
      message: 'Error resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to resolve error',
      error: error.message
    });
  }
});

module.exports = router;