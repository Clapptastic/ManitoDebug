/**
 * Authentication Validation Utilities
 * Comprehensive validation functions for authentication operations
 */

import { UserRole } from '@/types/core/unified';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && 
         !email.includes('..') && 
         email.length <= 254 &&
         email.split('@')[0].length <= 64;
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];
  
  if (weakPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common weak patterns');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user role
 */
export function validateRole(role: UserRole): boolean {
  return Object.values(UserRole).includes(role);
}

/**
 * Validates authentication credentials
 */
export function validateAuthCredentials(credentials: AuthCredentials): ValidationResult {
  const errors: string[] = [];
  
  if (!credentials.email) {
    errors.push('Email is required');
  } else if (!validateEmail(credentials.email)) {
    errors.push('Invalid email format');
  }
  
  if (!credentials.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(credentials.password);
    errors.push(...passwordValidation.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user registration data
 */
export function validateUserInput(userData: UserRegistrationData): ValidationResult {
  const errors: string[] = [];
  
  // Email validation
  if (!userData.email) {
    errors.push('Email is required');
  } else if (!validateEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  // Password validation
  if (!userData.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(userData.password);
    errors.push(...passwordValidation.errors);
  }
  
  // Full name validation (optional but if provided, must be valid)
  if (userData.full_name !== undefined) {
    if (typeof userData.full_name !== 'string') {
      errors.push('Full name must be a string');
    } else if (userData.full_name.length > 100) {
      errors.push('Full name must be less than 100 characters');
    } else if (userData.full_name.trim().length === 0) {
      errors.push('Full name cannot be empty');
    }
  }
  
  // Role validation (optional but if provided, must be valid)
  if (userData.role !== undefined && !validateRole(userData.role)) {
    errors.push('Invalid user role');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes user input to prevent XSS and other attacks
 */
export function sanitizeUserInput(input: Record<string, any>): Record<string, any> {
  const sanitized = { ...input };
  
  // Email sanitization
  if (typeof sanitized.email === 'string') {
    sanitized.email = sanitized.email.trim().toLowerCase();
  }
  
  // Full name sanitization
  if (typeof sanitized.full_name === 'string') {
    sanitized.full_name = sanitized.full_name
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>&"']/g, ''); // Remove potentially dangerous characters
  }
  
  // Remove any script-related content
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
  });
  
  return sanitized;
}

/**
 * Validates session token format
 */
export function validateSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format check (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if each part is base64 encoded
  try {
    parts.forEach(part => {
      if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
        throw new Error('Invalid base64');
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates password reset token
 */
export function validateResetToken(token: string): boolean {
  return validateSessionToken(token); // Same validation as session token
}

/**
 * Rate limiting validation for auth attempts
 */
export function validateAuthAttempts(attempts: number, timeWindow: number = 300000): boolean {
  // Allow maximum 5 attempts per 5 minutes
  const maxAttempts = 5;
  return attempts < maxAttempts;
}

/**
 * Validates user metadata structure
 */
export function validateUserMetadata(metadata: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  
  if (!metadata || typeof metadata !== 'object') {
    errors.push('Metadata must be an object');
    return { isValid: false, errors };
  }
  
  // Check for reserved keys
  const reservedKeys = ['id', 'email', 'created_at', 'updated_at'];
  const hasReservedKeys = Object.keys(metadata).some(key => reservedKeys.includes(key));
  
  if (hasReservedKeys) {
    errors.push('Metadata cannot contain reserved keys: ' + reservedKeys.join(', '));
  }
  
  // Check metadata size (should be reasonable)
  const metadataString = JSON.stringify(metadata);
  if (metadataString.length > 1024) {
    errors.push('Metadata size must be less than 1KB');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}