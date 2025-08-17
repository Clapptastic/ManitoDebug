# Email Validation System

## Overview

The ManitoDebug application includes a comprehensive email validation system that ensures `manito.ai` emails are always accepted for authentication while providing flexible domain management for other email providers.

## Key Features

### ✅ **manito.ai Domain Support**
- **Always Accepted**: `manito.ai` emails are guaranteed to be accepted regardless of configuration
- **Protected**: Cannot be removed from the allowed domains list
- **Priority**: Given highest priority in validation logic

### 🔧 **Configurable Domain Management**
- **Whitelist System**: Only emails from allowed domains are accepted
- **Environment Configuration**: Domains can be configured via environment variables
- **Runtime Updates**: Domains can be added/removed at runtime (admin only)

### 🛡️ **Security Features**
- **Format Validation**: Ensures proper email format
- **Domain Extraction**: Safely extracts and validates domains
- **Case Normalization**: Handles case-insensitive domain matching
- **Error Handling**: Provides clear error messages for rejected emails

## Configuration

### Environment Variables

```bash
# Email Configuration - Ensures manito.ai emails are accepted
ALLOWED_EMAIL_DOMAINS=manito.ai,manito.com,gmail.com,yahoo.com,outlook.com,hotmail.com
```

### Default Allowed Domains

The system includes these domains by default:
- `manito.ai` (always included, cannot be removed)
- `manito.com`
- `gmail.com`
- `yahoo.com`
- `outlook.com`
- `hotmail.com`

## API Endpoints

### Test Email Validation
```http
POST /api/auth/test-email
Content-Type: application/json

{
  "email": "test@manito.ai"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "test@manito.ai",
    "validation": {
      "valid": true,
      "value": "test@manito.ai",
      "error": null
    },
    "isManitoEmail": true,
    "allowedDomains": ["manito.ai", "manito.com", "gmail.com", ...]
  }
}
```

### Get Email Configuration (Admin Only)
```http
GET /api/auth/email-config
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowedDomains": ["manito.ai", "manito.com", "gmail.com", ...],
    "totalAllowedDomains": 6,
    "manitoAiEnabled": true,
    "environment": "development"
  }
}
```

### Update Email Configuration (Admin Only)
```http
PUT /api/auth/email-config
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "allowedDomains": ["manito.ai", "custom-domain.com", "another-domain.org"]
}
```

## Usage Examples

### Registration with manito.ai Email
```javascript
// This will always succeed
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@manito.ai',
    password: 'securepassword123',
    first_name: 'John',
    last_name: 'Doe'
  })
});
```

### Login with manito.ai Email
```javascript
// This will always succeed
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@manito.ai',
    password: 'securepassword123'
  })
});
```

### Testing Email Validation
```javascript
// Test if an email is from manito.ai
const testResponse = await fetch('/api/auth/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@manito.ai' })
});

const result = await testResponse.json();
console.log('Is manito.ai email:', result.data.isManitoEmail); // true
console.log('Is valid:', result.data.validation.valid); // true
```

## Error Messages

### Domain Not Allowed
```json
{
  "success": false,
  "error": "Registration failed",
  "message": "Email domain 'blocked-domain.com' is not allowed. Allowed domains: manito.ai, manito.com, gmail.com, yahoo.com, outlook.com, hotmail.com"
}
```

### Invalid Email Format
```json
{
  "success": false,
  "error": "Registration failed",
  "message": "Invalid email format"
}
```

### manito.ai Specific Error
```json
{
  "success": false,
  "error": "Registration failed",
  "message": "manito.ai emails should be accepted. Please contact support if you're experiencing issues."
}
```

## Testing

### Run Email Validation Tests
```bash
npm run test:email-validation
```

This test script verifies:
- ✅ manito.ai emails are always accepted
- ✅ Other allowed domains work correctly
- ✅ Invalid domains are properly rejected
- ✅ Email format validation works
- ✅ Domain management functions correctly
- ✅ Environment variable loading works

### Test Output Example
```
🧪 Testing Email Validation System

📧 Testing Email Validation

Test 1: test@manito.ai
  ✅ Valid: test@manito.ai
  📧 Domain: manito.ai
  🏢 Manito.ai: Yes

Test 2: user@gmail.com
  ✅ Valid: user@gmail.com
  📧 Domain: gmail.com
  🏢 Manito.ai: No

Test 3: invalid-email
  ❌ Invalid: Invalid email format

🎯 Manito.ai Specific Tests

Manito Test 1: test@manito.ai
  ✅ Manito.ai email accepted correctly

Manito Test 2: user@manito.ai
  ✅ Manito.ai email accepted correctly

📊 Test Summary

Tests Passed: 15/15
Success Rate: 100.0%

🎉 All tests passed! Email validation system is working correctly.
✅ manito.ai emails are properly accepted and validated.

✨ Email validation system is ready for production use!
```

## Implementation Details

### Core Components

1. **EmailConfig Class** (`server/config/email.js`)
   - Manages allowed domains
   - Handles domain validation
   - Provides configuration management

2. **Custom Joi Extension** (`server/utils/emailValidation.js`)
   - Extends Joi with custom email validation
   - Integrates with EmailConfig
   - Provides reusable validation schemas

3. **Updated User Model** (`server/models/User.js`)
   - Uses new email validation
   - Ensures consistent email handling
   - Provides domain-aware user operations

4. **Enhanced Auth Routes** (`server/routes/auth.js`)
   - Uses custom email validation schemas
   - Provides email configuration endpoints
   - Includes comprehensive error handling

### Security Considerations

- **manito.ai Protection**: The domain cannot be removed from allowed list
- **Input Sanitization**: All emails are normalized and validated
- **Error Information**: Limited error details to prevent information leakage
- **Admin Controls**: Domain management restricted to admin users

### Performance

- **Caching**: Domain list is cached in memory
- **Efficient Validation**: O(1) domain lookup using Set
- **Minimal Overhead**: Validation adds minimal processing time

## Troubleshooting

### Common Issues

1. **manito.ai emails being rejected**
   - Check that `ALLOWED_EMAIL_DOMAINS` includes `manito.ai`
   - Verify the email validation system is properly initialized
   - Run the test script to verify functionality

2. **Custom domains not working**
   - Ensure domains are added to `ALLOWED_EMAIL_DOMAINS`
   - Check for typos in domain names
   - Verify environment variable is properly set

3. **Validation errors**
   - Check email format (must include @ and valid domain)
   - Verify domain is in allowed list
   - Check server logs for detailed error information

### Debug Commands

```bash
# Test email validation system
npm run test:email-validation

# Check current email configuration
curl -X GET http://localhost:3000/api/auth/email-config

# Test specific email
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@manito.ai"}'
```

## Migration Guide

### From Basic Email Validation

If upgrading from basic email validation:

1. **Update Environment Variables**
   ```bash
   # Add to your .env file
   ALLOWED_EMAIL_DOMAINS=manito.ai,manito.com,gmail.com,yahoo.com,outlook.com,hotmail.com
   ```

2. **Update Docker Configuration**
   ```dockerfile
   # Add to Dockerfile
   ENV ALLOWED_EMAIL_DOMAINS=manito.ai,manito.com,gmail.com,yahoo.com,outlook.com,hotmail.com
   ```

3. **Test the System**
   ```bash
   npm run test:email-validation
   ```

### Backward Compatibility

The new system maintains backward compatibility:
- Existing user accounts continue to work
- API endpoints remain the same
- Error messages are enhanced but not breaking

## Future Enhancements

- **Domain Verification**: Email domain MX record validation
- **Subdomain Support**: Allow specific subdomains
- **Rate Limiting**: Per-domain email registration limits
- **Analytics**: Track email domain usage patterns
- **Webhook Integration**: Notify external systems of domain changes
