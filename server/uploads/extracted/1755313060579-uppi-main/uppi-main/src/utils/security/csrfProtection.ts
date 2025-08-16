/**
 * CSRF Protection System
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import { nanoid } from 'nanoid';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return nanoid(32);
}

/**
 * Set CSRF token in localStorage and cookie
 */
export function setCSRFToken(token: string): void {
  // Store in localStorage for SPA access
  localStorage.setItem(CSRF_TOKEN_KEY, token);
  
  // Set httpOnly cookie (this would be done server-side in production)
  // For now, we'll use a regular cookie as a fallback
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; Secure; SameSite=Strict; Path=/`;
}

/**
 * Get current CSRF token
 */
export function getCSRFToken(): string | null {
  return localStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * Initialize CSRF protection
 */
export function initializeCSRF(): string {
  let token = getCSRFToken();
  
  if (!token) {
    token = generateCSRFToken();
    setCSRFToken(token);
  }
  
  return token;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(headerToken: string, cookieToken?: string): boolean {
  const storedToken = getCSRFToken();
  
  if (!storedToken || !headerToken) {
    return false;
  }
  
  // Double Submit Cookie pattern - token must match in both places
  if (cookieToken) {
    return storedToken === headerToken && storedToken === cookieToken;
  }
  
  // Fallback to localStorage comparison
  return storedToken === headerToken;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  
  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }
  
  return headers;
}

/**
 * Fetch wrapper with CSRF protection
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getCSRFToken();
  
  if (!token) {
    throw new Error('CSRF token not available. Please refresh the page.');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    [CSRF_HEADER_NAME]: token,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * CSRF protection middleware for requests
 */
export function withCSRFProtection<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T
): T {
  return (async (...args: any[]) => {
    const token = getCSRFToken();
    
    if (!token) {
      // Try to initialize if not present
      initializeCSRF();
    }
    
    return apiFunction(...args);
  }) as T;
}

/**
 * React hook for CSRF protection
 */
export function useCSRFProtection() {
  const token = getCSRFToken();
  
  if (!token) {
    initializeCSRF();
  }
  
  return {
    token: getCSRFToken(),
    addHeaders: addCSRFHeaders,
    fetch: csrfFetch,
    validate: validateCSRFToken,
    regenerate: () => {
      const newToken = generateCSRFToken();
      setCSRFToken(newToken);
      return newToken;
    },
  };
}

/**
 * Constants for external use
 */
export const CSRF_CONSTANTS = {
  TOKEN_KEY: CSRF_TOKEN_KEY,
  HEADER_NAME: CSRF_HEADER_NAME,
  COOKIE_NAME: CSRF_COOKIE_NAME,
} as const;