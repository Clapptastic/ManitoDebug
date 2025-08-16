import { corsHeaders } from './cors.ts';

/**
 * Standardized error handling for edge functions
 */

export interface ErrorDetails {
  code?: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export class EdgeFunctionError extends Error {
  public code?: string;
  public details?: any;
  public statusCode: number;

  constructor(error: ErrorDetails) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
    this.statusCode = error.statusCode || 500;
    this.name = 'EdgeFunctionError';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: any): Response {
  console.error('Edge Function Error:', error);

  let errorDetails: ErrorDetails;

  if (error instanceof EdgeFunctionError) {
    errorDetails = {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode
    };
  } else if (error instanceof Error) {
    errorDetails = {
      message: error.message,
      statusCode: 500
    };
  } else {
    errorDetails = {
      message: 'Unknown error occurred',
      statusCode: 500
    };
  }

  // Map common errors to appropriate status codes
  if (errorDetails.message.includes('authorization') || 
      errorDetails.message.includes('authentication') ||
      errorDetails.message.includes('Unauthorized')) {
    errorDetails.statusCode = 401;
  } else if (errorDetails.message.includes('permission') || 
             errorDetails.message.includes('forbidden')) {
    errorDetails.statusCode = 403;
  } else if (errorDetails.message.includes('not found')) {
    errorDetails.statusCode = 404;
  } else if (errorDetails.message.includes('validation') || 
             errorDetails.message.includes('invalid') ||
             errorDetails.message.includes('required')) {
    errorDetails.statusCode = 400;
  }

  return new Response(JSON.stringify({
    success: false,
    error: errorDetails.message,
    code: errorDetails.code,
    details: errorDetails.details,
    timestamp: new Date().toISOString()
  }), {
    status: errorDetails.statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}