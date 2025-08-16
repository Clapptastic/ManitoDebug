
import { corsHeaders } from './cors.ts';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export function createErrorResponse(error: ApiError, status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

export function handleApiError(error: unknown): Response {
  console.error('API error:', error);
  
  if (error instanceof Error) {
    return createErrorResponse({
      message: error.message,
      details: error.stack
    }, 500);
  }
  
  return createErrorResponse({
    message: 'An unexpected error occurred',
    details: String(error)
  }, 500);
}
