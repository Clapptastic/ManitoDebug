/**
 * Secure API Key Validation Edge Function
 * Validates user API keys with RPC security and comprehensive error handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, getAuthenticatedUser } from '../_shared/supabase-client.ts';
import { handleCORS, createJSONResponse } from '../_shared/cors.ts';
import { withErrorHandling, EdgeFunctionError } from '../_shared/error-handler.ts';
import { validateInput, ValidationSchema } from '../_shared/validation.ts';
import { logInfo, logError, PerformanceTracker } from '../_shared/logging.ts';
import { checkRateLimit, RATE_LIMITS, createRateLimitHeaders } from '../_shared/rate-limiter.ts';
import { validateApiKey } from '../_shared/api-key-validators.ts';
import { getUserIP } from '../_shared/security.ts';

interface ValidationRequest {
  provider: string;
  test_call?: boolean;
}

const requestSchema: ValidationSchema = {
  provider: {
    required: true,
    type: 'string',
    enum: ['openai', 'anthropic', 'gemini', 'perplexity', 'groq', 'mistral', 'cohere']
  },
  test_call: {
    type: 'boolean'
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  const tracker = new PerformanceTracker('api-key-validation', {
    functionName: 'api-key-validation-secure'
  });

  try {
    // Rate limiting
    const userIP = getUserIP(req);
    const rateLimitResult = checkRateLimit(userIP, RATE_LIMITS.VALIDATION);
    
    if (!rateLimitResult.allowed) {
      throw new EdgeFunctionError({
        message: 'Rate limit exceeded',
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Initialize Supabase client
    const supabase = createSupabaseClient({ 
      useServiceRole: true,
      authToken: req.headers.get('authorization') || undefined
    });

    // Authenticate user
    const user = await getAuthenticatedUser(supabase, req.headers.get('authorization'));
    
    // Parse and validate request body
    const requestBody: ValidationRequest = await req.json();
    validateInput(requestBody, requestSchema);

    const { provider, test_call = false } = requestBody;

    logInfo('Validating API key', { 
      userId: user.id, 
      provider, 
      testCall: test_call 
    });

    // Use secure RPC function for validation
    const { data: validationResult, error: rpcError } = await supabase
      .rpc('validate_user_api_key', {
        provider_param: provider,
        test_call: test_call
      });

    if (rpcError) {
      logError(rpcError, 'RPC validation failed', { provider, userId: user.id });
      throw new EdgeFunctionError({
        message: 'API key validation failed',
        statusCode: 500,
        details: rpcError
      });
    }

    // If test_call is true, also perform live API validation
    let liveValidationResult = null;
    if (test_call && validationResult?.valid) {
      try {
        // Get the API key securely
        const { data: apiKeyData } = await supabase
          .rpc('vault_retrieve_api_key', {
            p_user_id: user.id,
            p_provider: provider
          });

        if (apiKeyData) {
          liveValidationResult = await validateApiKey(provider, apiKeyData);
        }
      } catch (validationError) {
        logError(validationError, 'Live API validation failed', { provider, userId: user.id });
        // Don't fail the entire request for live validation errors
      }
    }

    const duration = tracker.finish('API key validation completed');

    logInfo('API key validation completed', { 
      provider, 
      valid: validationResult?.valid,
      userId: user.id,
      duration,
      liveValidation: !!liveValidationResult
    });

    return createJSONResponse({
      success: true,
      data: {
        ...validationResult,
        liveValidation: liveValidationResult
      },
      meta: {
        duration,
        provider,
        timestamp: new Date().toISOString()
      }
    }, {
      additionalHeaders: createRateLimitHeaders(rateLimitResult)
    });

  } catch (error) {
    const duration = tracker.finish('API key validation failed');
    
    if (error instanceof EdgeFunctionError) {
      throw error;
    }

    logError(error, 'API key validation failed', {
      functionName: 'api-key-validation-secure',
      duration
    });
    
    throw new EdgeFunctionError({
      message: 'API key validation failed',
      statusCode: 500,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

serve(withErrorHandling(handler));