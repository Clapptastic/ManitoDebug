/**
 * Security Manager for API Key Operations
 * Handles key rotation, audit logging, and security monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiKeyType } from '@/types/api-keys/unified';

export interface SecurityAuditEvent {
  operation: string;
  provider: string;
  timestamp: Date;
  userId: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface SecurityPolicy {
  keyRotationIntervalDays: number;
  maxFailedValidations: number;
  suspiciousActivityThreshold: number;
  requireMFA: boolean;
}

class ApiKeySecurityManager {
  private readonly DEFAULT_POLICY: SecurityPolicy = {
    keyRotationIntervalDays: 90,
    maxFailedValidations: 5,
    suspiciousActivityThreshold: 10,
    requireMFA: false
  };

  /**
   * Log security-relevant API key operations
   */
  async logSecurityEvent(event: Omit<SecurityAuditEvent, 'timestamp' | 'userId'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const auditEvent: SecurityAuditEvent = {
        ...event,
        timestamp: new Date(),
        userId: user.id
      };

      // Log to audit table
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: `api_key_${event.operation}`,
          resource_type: 'api_keys',
          resource_id: event.provider,
          metadata: {
            ...event.metadata,
            riskLevel: event.riskLevel,
            success: event.success,
            timestamp: auditEvent.timestamp.toISOString()
          }
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Check for suspicious activity patterns
      await this.detectSuspiciousActivity(user.id, auditEvent);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(userId: string, event: SecurityAuditEvent): Promise<void> {
    try {
      // Check for rapid successive operations
      const recentEvents = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('resource_type', 'api_keys')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentEvents.data && recentEvents.data.length > this.DEFAULT_POLICY.suspiciousActivityThreshold) {
        await this.alertSuspiciousActivity(userId, 'high_frequency_operations', {
          eventCount: recentEvents.data.length,
          timeWindow: '5_minutes'
        });
      }

      // Check for failed validations
      const failedValidations = recentEvents.data?.filter(log => 
        log.action.includes('validate') && 
        (log.metadata as any)?.success === false
      ).length || 0;

      if (failedValidations >= this.DEFAULT_POLICY.maxFailedValidations) {
        await this.alertSuspiciousActivity(userId, 'repeated_validation_failures', {
          failureCount: failedValidations
        });
      }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }
  }

  /**
   * Alert on suspicious activity
   */
  private async alertSuspiciousActivity(
    userId: string, 
    activityType: string, 
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      console.warn(`Suspicious API key activity detected for user ${userId}:`, {
        activityType,
        metadata,
        timestamp: new Date().toISOString()
      });

      // Log high-risk security event
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'security_alert',
          resource_type: 'security',
          metadata: {
            alertType: 'suspicious_api_key_activity',
            activityType,
            riskLevel: 'high',
            ...metadata,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Failed to log security alert:', error);
      }
    } catch (error) {
      console.error('Error alerting suspicious activity:', error);
    }
  }

  /**
   * Check if API key needs rotation
   */
  async checkKeyRotationNeeded(provider: ApiKeyType): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: apiKey } = await supabase
        .from('api_keys')
        .select('created_at, last_security_audit')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('is_active', true)
        .single();

      if (!apiKey) return false;

      const lastAudit = apiKey.last_security_audit || apiKey.created_at;
      const daysSinceAudit = Math.floor(
        (Date.now() - new Date(lastAudit).getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysSinceAudit >= this.DEFAULT_POLICY.keyRotationIntervalDays;
    } catch (error) {
      console.error('Error checking key rotation status:', error);
      return false;
    }
  }

  /**
   * Validate API key security
   */
  async validateKeySecurity(provider: ApiKeyType, apiKey: string): Promise<{
    isSecure: boolean;
    warnings: string[];
    recommendations: string[];
  }> {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check key length and format
    if (apiKey.length < 32) {
      warnings.push('API key appears to be too short');
      recommendations.push('Verify this is a valid API key from the provider');
    }

    // Check for common security issues
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
      warnings.push('API key contains whitespace characters');
      recommendations.push('Remove any whitespace from the API key');
    }

    // Provider-specific validations
    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          warnings.push('OpenAI API key should start with "sk-"');
        }
        break;
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          warnings.push('Anthropic API key should start with "sk-ant-"');
        }
        break;
    }

    // Check if key needs rotation
    const needsRotation = await this.checkKeyRotationNeeded(provider);
    if (needsRotation) {
      warnings.push('API key is overdue for rotation');
      recommendations.push('Consider rotating this API key for better security');
    }

    const isSecure = warnings.length === 0;

    // Log security validation
    await this.logSecurityEvent({
      operation: 'security_validation',
      provider,
      success: isSecure,
      riskLevel: isSecure ? 'low' : 'medium',
      metadata: {
        warningCount: warnings.length,
        warnings,
        keyLength: apiKey.length
      }
    });

    return {
      isSecure,
      warnings,
      recommendations
    };
  }

  /**
   * Sanitize error messages to prevent information leakage
   */
  sanitizeErrorMessage(error: Error | string, context: string): string {
    const message = error instanceof Error ? error.message : error;
    
    // Remove sensitive information patterns
    const sanitized = message
      .replace(/sk-[a-zA-Z0-9-_]{32,}/g, '[REDACTED_API_KEY]')
      .replace(/Bearer\s+[a-zA-Z0-9-_]+/g, '[REDACTED_TOKEN]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]')
      .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_CARD]');

    // Log sanitization for audit
    if (sanitized !== message) {
      console.warn(`Sanitized error message in context: ${context}`);
    }

    return sanitized;
  }

  /**
   * Generate secure random identifiers
   */
  generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Rate limiting check for API operations
   */
  async checkRateLimit(operation: string, windowMs = 60000, maxRequests = 10): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const windowStart = new Date(Date.now() - windowMs);
      
      const { data: recentOps } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', `api_key_${operation}`)
        .gte('created_at', windowStart.toISOString());

      const requestCount = recentOps?.length || 0;
      
      if (requestCount >= maxRequests) {
        await this.logSecurityEvent({
          operation: 'rate_limit_exceeded',
          provider: 'system',
          success: false,
          riskLevel: 'medium',
          metadata: {
            operation,
            requestCount,
            windowMs,
            maxRequests
          }
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return true; // Fail open for now
    }
  }
}

export const apiKeySecurityManager = new ApiKeySecurityManager();
export default apiKeySecurityManager;