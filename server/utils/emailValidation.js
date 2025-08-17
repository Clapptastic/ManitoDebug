import Joi from 'joi';
import emailConfig from '../config/email.js';

/**
 * Custom Joi validation for email addresses with domain whitelist support
 * Ensures manito.ai emails are always accepted
 */

// Create custom Joi extension for email validation
const emailValidationExtension = Joi.extend((joi) => ({
  type: 'email',
  base: joi.string(),
  messages: {
    'email.invalid': '{{#label}} must be a valid email address',
    'email.domainNotAllowed': '{{#label}} domain is not allowed. Allowed domains: {{#allowedDomains}}',
    'email.manitoRequired': '{{#label}} must be from manito.ai domain'
  },
  validate(value, helpers) {
    // Basic string validation
    if (typeof value !== 'string') {
      return { value, errors: helpers.error('email.invalid') };
    }

    // Use our email config validation
    const validation = emailConfig.validateEmail(value);
    
    if (!validation.valid) {
      return { value, errors: helpers.error('email.invalid', { message: validation.error }) };
    }

    return { value: validation.email };
  },
  rules: {
    manitoOnly: {
      validate(value, helpers) {
        if (!emailConfig.isManitoEmail(value)) {
          return helpers.error('email.manitoRequired');
        }
        return value;
      }
    },
    allowedDomains: {
      method(domains) {
        return this.$_addRule({ name: 'allowedDomains', args: { domains } });
      },
      validate(value, helpers, args) {
        const domain = emailConfig.extractDomain(value);
        if (!args.domains.includes(domain)) {
          return helpers.error('email.domainNotAllowed', { 
            allowedDomains: args.domains.join(', ') 
          });
        }
        return value;
      }
    }
  }
}));

// Export the extended Joi with email validation
export const emailJoi = emailValidationExtension;

// Convenience functions for common email validation patterns
export const emailSchemas = {
  // Basic email validation with domain whitelist
  basic: emailJoi.email().required(),
  
  // Email validation for manito.ai only
  manitoOnly: emailJoi.email().manitoOnly().required(),
  
  // Email validation with custom domain list
  customDomains: (domains) => emailJoi.email().allowedDomains(domains).required(),
  
  // Email validation for registration (allows all configured domains)
  registration: emailJoi.email().required(),
  
  // Email validation for login
  login: emailJoi.email().required(),
  
  // Email validation for profile updates
  profileUpdate: emailJoi.email().optional()
};

// Export the email config for direct access
export { emailConfig };

// Export validation helper functions
export const emailValidation = {
  /**
   * Validate email with custom error handling
   * @param {string} email - Email to validate
   * @returns {Object} - Validation result
   */
  validate: (email) => {
    try {
      // Use our email config validation directly
      const validation = emailConfig.validateEmail(email);
      return {
        valid: validation.valid,
        value: validation.valid ? validation.email : null,
        error: validation.valid ? null : validation.error
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  /**
   * Check if email is from manito.ai
   * @param {string} email - Email to check
   * @returns {boolean} - Whether email is from manito.ai
   */
  isManitoEmail: (email) => emailConfig.isManitoEmail(email),

  /**
   * Get allowed domains
   * @returns {Array} - Array of allowed domains
   */
  getAllowedDomains: () => emailConfig.getAllowedDomains(),

  /**
   * Get email configuration
   * @returns {Object} - Email configuration details
   */
  getConfig: () => emailConfig.getConfig(),

  /**
   * Load configuration from environment
   */
  loadFromEnvironment: () => emailConfig.loadFromEnvironment()
};
