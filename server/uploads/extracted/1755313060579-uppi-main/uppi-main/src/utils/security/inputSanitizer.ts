/**
 * Comprehensive Input Sanitization System
 * Protects against XSS, injection attacks, and malformed input
 */

import DOMPurify from 'dompurify';

/**
 * Configuration for different sanitization contexts
 */
interface SanitizeOptions {
  allowHtml?: boolean;
  allowLinks?: boolean;
  maxLength?: number;
  stripScripts?: boolean;
  preserveWhitespace?: boolean;
}

/**
 * Default sanitization options for different contexts
 */
const SANITIZE_CONTEXTS = {
  // For user input that should never contain HTML
  PLAIN_TEXT: {
    allowHtml: false,
    allowLinks: false,
    maxLength: 1000,
    stripScripts: true,
    preserveWhitespace: false,
  },
  // For rich text content that may contain some HTML
  RICH_TEXT: {
    allowHtml: true,
    allowLinks: true,
    maxLength: 10000,
    stripScripts: true,
    preserveWhitespace: true,
  },
  // For API keys and sensitive data
  SENSITIVE: {
    allowHtml: false,
    allowLinks: false,
    maxLength: 500,
    stripScripts: true,
    preserveWhitespace: false,
  },
  // For search queries and form inputs
  FORM_INPUT: {
    allowHtml: false,
    allowLinks: false,
    maxLength: 500,
    stripScripts: true,
    preserveWhitespace: false,
  },
} as const;

/**
 * Sanitize a string value based on context
 */
export function sanitizeString(
  input: string,
  context: keyof typeof SANITIZE_CONTEXTS = 'PLAIN_TEXT'
): string {
  if (typeof input !== 'string') {
    return '';
  }

  const options = SANITIZE_CONTEXTS[context];
  let sanitized = input;

  // Trim whitespace unless preserving it
  if (!options.preserveWhitespace) {
    sanitized = sanitized.trim();
  }

  // Apply length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Handle HTML content
  if (options.allowHtml) {
    // Use DOMPurify for safe HTML sanitization
    const config: any = {
      ALLOWED_TAGS: options.allowLinks 
        ? ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'a', 'ul', 'ol', 'li']
        : ['p', 'br', 'strong', 'em', 'u', 'i', 'b'],
      ALLOWED_ATTR: options.allowLinks ? ['href', 'target', 'rel'] : [],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    };

    if (!options.stripScripts) {
      config.FORBID_TAGS = ['script', 'object', 'embed', 'iframe'];
    }

    sanitized = DOMPurify.sanitize(sanitized, config) as unknown as string;
  } else {
    // Strip all HTML tags for plain text
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    }) as unknown as string;
  }

  // Additional protection against common injection patterns
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  context: keyof typeof SANITIZE_CONTEXTS = 'FORM_INPUT'
): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value, context) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeString(item, context)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item, context)
          : item
      ) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value, context) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize API key input
 */
export function sanitizeApiKey(apiKey: string): string {
  if (typeof apiKey !== 'string') {
    throw new Error('API key must be a string');
  }

  // Remove any potential injection attempts
  const sanitized = apiKey
    .trim()
    .replace(/[<>'"&\x00-\x1F\x7F]/g, '') // Remove control chars and potential HTML
    .substring(0, 500); // Reasonable API key length limit

  if (!sanitized) {
    throw new Error('Invalid API key format');
  }

  return sanitized;
}

/**
 * Sanitize URL parameters and query strings
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Sanitize each query parameter
    const sanitizedParams = new URLSearchParams();
    for (const [key, value] of urlObj.searchParams.entries()) {
      const sanitizedKey = sanitizeString(key, 'FORM_INPUT');
      const sanitizedValue = sanitizeString(value, 'FORM_INPUT');
      if (sanitizedKey && sanitizedValue) {
        sanitizedParams.set(sanitizedKey, sanitizedValue);
      }
    }

    urlObj.search = sanitizedParams.toString();
    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize form data before submission
 */
export function sanitizeFormData<T extends Record<string, any>>(formData: T): T {
  return sanitizeObject(formData, 'FORM_INPUT');
}

/**
 * Sanitize rich text content (for markdown, HTML content, etc.)
 */
export function sanitizeRichText(content: string): string {
  return sanitizeString(content, 'RICH_TEXT');
}

/**
 * Validation helper - check if string contains potential XSS
 */
export function containsPotentialXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Export sanitization contexts for external use
 */
export { SANITIZE_CONTEXTS };