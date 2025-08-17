/**
 * Email Configuration and Domain Management
 * 
 * Features:
 * - Domain whitelist management
 * - Email validation with custom rules
 * - Support for manito.ai domain
 * - Configurable allowed domains
 * - Environment-based domain restrictions
 */

class EmailConfig {
  constructor() {
    // Default allowed domains (always include manito.ai)
    this.allowedDomains = new Set([
      'manito.ai',
      'manito.com',
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com'
    ]);

    // Load from environment variables
    this.loadFromEnvironment();
  }

  /**
   * Load allowed domains from environment variables
   */
  loadFromEnvironment() {
    const envDomains = process.env.ALLOWED_EMAIL_DOMAINS;
    if (envDomains) {
      const domains = envDomains.split(',').map(d => d.trim().toLowerCase());
      this.allowedDomains = new Set(domains);
    }

    // Always ensure manito.ai is included
    this.allowedDomains.add('manito.ai');
  }

  /**
   * Add a domain to the allowed list
   * @param {string} domain - Domain to add
   */
  addAllowedDomain(domain) {
    if (domain && typeof domain === 'string') {
      this.allowedDomains.add(domain.toLowerCase());
    }
  }

  /**
   * Remove a domain from the allowed list (except manito.ai)
   * @param {string} domain - Domain to remove
   */
  removeAllowedDomain(domain) {
    if (domain && typeof domain === 'string' && domain.toLowerCase() !== 'manito.ai') {
      this.allowedDomains.delete(domain.toLowerCase());
    }
  }

  /**
   * Get all allowed domains
   * @returns {Array} - Array of allowed domains
   */
  getAllowedDomains() {
    return Array.from(this.allowedDomains);
  }

  /**
   * Check if a domain is allowed
   * @param {string} domain - Domain to check
   * @returns {boolean} - Whether domain is allowed
   */
  isDomainAllowed(domain) {
    if (!domain || typeof domain !== 'string') {
      return false;
    }
    return this.allowedDomains.has(domain.toLowerCase());
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string|null} - Domain or null if invalid
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }

    // More robust email regex that handles edge cases
    const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
    const match = email.match(emailRegex);
    
    if (match) {
      return match[1].toLowerCase();
    }
    
    return null;
  }

  /**
   * Validate email address format and domain
   * @param {string} email - Email address to validate
   * @returns {Object} - Validation result
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return {
        valid: false,
        error: 'Email is required and must be a string'
      };
    }

    // Trim whitespace
    email = email.trim();
    
    if (email.length === 0) {
      return {
        valid: false,
        error: 'Email cannot be empty'
      };
    }

    // Basic email format validation (more permissive for edge cases)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'Invalid email format'
      };
    }

    // Check for common invalid patterns
    if (email.includes('..') || email.includes('@@') || email.startsWith('.') || email.endsWith('.')) {
      return {
        valid: false,
        error: 'Invalid email format'
      };
    }

    // Extract and validate domain
    const domain = this.extractDomain(email);
    if (!domain) {
      return {
        valid: false,
        error: 'Could not extract domain from email'
      };
    }

    // Check if domain is allowed
    if (!this.isDomainAllowed(domain)) {
      return {
        valid: false,
        error: `Email domain '${domain}' is not allowed. Allowed domains: ${this.getAllowedDomains().join(', ')}`
      };
    }

    return {
      valid: true,
      domain: domain,
      email: email.toLowerCase()
    };
  }

  /**
   * Get validation error message for a specific domain
   * @param {string} domain - Domain that was rejected
   * @returns {string} - User-friendly error message
   */
  getDomainError(domain) {
    if (domain === 'manito.ai') {
      return 'manito.ai emails should be accepted. Please contact support if you\'re experiencing issues.';
    }
    
    return `Email domain '${domain}' is not allowed. Please use one of the following domains: ${this.getAllowedDomains().join(', ')}`;
  }

  /**
   * Check if email is from manito.ai domain
   * @param {string} email - Email address
   * @returns {boolean} - Whether email is from manito.ai
   */
  isManitoEmail(email) {
    const domain = this.extractDomain(email);
    return domain === 'manito.ai';
  }

  /**
   * Get configuration summary
   * @returns {Object} - Configuration details
   */
  getConfig() {
    return {
      allowedDomains: this.getAllowedDomains(),
      totalAllowedDomains: this.allowedDomains.size,
      manitoAiEnabled: this.allowedDomains.has('manito.ai'),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

// Create singleton instance
const emailConfig = new EmailConfig();

export default emailConfig;
