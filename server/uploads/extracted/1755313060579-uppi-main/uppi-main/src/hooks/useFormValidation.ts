/**
 * Enhanced Form Validation Hook with User Feedback
 * Provides comprehensive form validation with clear error messages
 */

import { useState, useCallback } from 'react';
import { validateAndHandle, handleSuccess } from '@/utils/errorHandling';

export interface ValidationRule {
  field: string;
  rule: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface FormState {
  [field: string]: any;
}

export interface FormErrors {
  [field: string]: string;
}

export interface UseFormValidationResult {
  errors: FormErrors;
  isValid: boolean;
  isValidating: boolean;
  validate: (formData: FormState, schema: ValidationSchema) => boolean;
  validateField: (field: string, value: any, rules: ValidationRule[]) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  setFieldError: (field: string, error: string) => void;
}

export function useFormValidation(): UseFormValidationResult {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const validateField = useCallback((
    field: string, 
    value: any, 
    rules: ValidationRule[]
  ): boolean => {
    for (const rule of rules) {
      const result = validateAndHandle(
        () => rule.rule(value),
        { 
          action: 'Field Validation',
          metadata: { field, rule: rule.message || 'validation rule' }
        }
      );

      if (typeof result === 'string') {
        setFieldError(field, result);
        return false;
      }

      if (!result) {
        const errorMessage = rule.message || `${field} is invalid`;
        setFieldError(field, errorMessage);
        return false;
      }
    }

    clearFieldError(field);
    return true;
  }, [setFieldError, clearFieldError]);

  const validate = useCallback((
    formData: FormState, 
    schema: ValidationSchema
  ): boolean => {
    setIsValidating(true);
    let isFormValid = true;
    const newErrors: FormErrors = {};

    try {
      // Validate each field according to schema
      for (const [fieldName, rules] of Object.entries(schema)) {
        const fieldValue = formData[fieldName];
        
        for (const rule of rules) {
          const result = rule.rule(fieldValue);
          
          if (typeof result === 'string') {
            newErrors[fieldName] = result;
            isFormValid = false;
            break;
          }
          
          if (!result) {
            const errorMessage = rule.message || `${fieldName} is invalid`;
            newErrors[fieldName] = errorMessage;
            isFormValid = false;
            break;
          }
        }
      }

      setErrors(newErrors);

      if (isFormValid) {
        handleSuccess('Form Validation', 'All fields are valid');
      }

      return isFormValid;
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    isValidating,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}

// Common validation rules
export const validationRules = {
  required: (message?: string) => ({
    rule: (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    },
    message: message || 'This field is required'
  }),

  email: (message?: string) => ({
    rule: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: message || 'Please enter a valid email address'
  }),

  minLength: (min: number, message?: string) => ({
    rule: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      return value.length >= min;
    },
    message: message || `Must be at least ${min} characters long`
  }),

  maxLength: (max: number, message?: string) => ({
    rule: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      return value.length <= max;
    },
    message: message || `Must be no more than ${max} characters long`
  }),

  apiKey: (provider: string, message?: string) => ({
    rule: (value: string) => {
      if (!value) return false;
      
      // Basic API key format validation
      switch (provider.toLowerCase()) {
        case 'openai':
          return value.startsWith('sk-') && value.length > 20;
        case 'anthropic':
          return value.startsWith('sk-ant-') && value.length > 20;
        case 'perplexity':
          return value.startsWith('pplx-') && value.length > 20;
        case 'google':
        case 'gemini':
          return value.length > 10; // Google API keys vary in format
        default:
          return value.length > 10; // Generic validation
      }
    },
    message: message || `Please enter a valid ${provider} API key`
  }),

  url: (message?: string) => ({
    rule: (value: string) => {
      if (!value) return true; // Allow empty for optional fields
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: message || 'Please enter a valid URL'
  }),

  custom: (rule: (value: any) => boolean | string, message?: string) => ({
    rule,
    message: message || 'Invalid value'
  })
};