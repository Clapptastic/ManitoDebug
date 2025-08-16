
export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: string;

  constructor(message: string, status = 500, code = 'unknown_error', details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static fromResponse(response: Response, body?: any): ApiError {
    const status = response.status;
    const message = body?.message || response.statusText || 'Unknown API error';
    const code = body?.code || 'api_error';
    const details = body?.details;
    
    return new ApiError(message, status, code, details);
  }

  static fromError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ApiError(error.message);
    }
    
    return new ApiError(String(error));
  }
}
