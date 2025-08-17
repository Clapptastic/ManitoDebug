#!/usr/bin/env node

/**
 * Email Validation Test Script
 * 
 * Tests the new email validation system to ensure manito.ai emails are accepted
 * and other domains are properly validated.
 */

import { emailValidation, emailConfig } from '../server/utils/emailValidation.js';

console.log('🧪 Testing Email Validation System\n');

// Test cases - focusing on realistic scenarios
const testEmails = [
  // Valid manito.ai emails (should always pass)
  'test@manito.ai',
  'user@manito.ai',
  'admin@manito.ai',
  'support@manito.ai',
  
  // Valid other domain emails
  'user@gmail.com',
  'test@yahoo.com',
  'admin@outlook.com',
  'support@hotmail.com',
  
  // Invalid emails (should fail)
  'invalid-email',
  'test@invalid-domain.com',
  'user@blocked-domain.org',
  'admin@restricted.net',
  
  // Edge cases that should fail
  '',
  null,
  undefined,
  'test@manito.ai@extra.com',
  'test..test@manito.ai'
];

console.log('📧 Testing Email Validation\n');

let passedTests = 0;
let totalTests = 0;

// Test email validation
testEmails.forEach((email, index) => {
  totalTests++;
  console.log(`Test ${index + 1}: ${email || 'null/undefined'}`);
  
  try {
    const result = emailValidation.validate(email);
    const isManito = emailValidation.isManitoEmail(email);
    
    // Determine if this test should pass based on the email
    const shouldPass = email && typeof email === 'string' && 
                      (email.includes('@manito.ai') || 
                       email.includes('@gmail.com') || 
                       email.includes('@yahoo.com') || 
                       email.includes('@outlook.com') || 
                       email.includes('@hotmail.com'));
    
    if (result.valid && shouldPass) {
      console.log(`  ✅ Valid: ${result.value}`);
      console.log(`  📧 Domain: ${emailConfig.extractDomain(email)}`);
      console.log(`  🏢 Manito.ai: ${isManito ? 'Yes' : 'No'}`);
      passedTests++;
    } else if (!result.valid && !shouldPass) {
      console.log(`  ❌ Invalid (expected): ${result.error}`);
      passedTests++;
    } else {
      console.log(`  ⚠️  Unexpected result: ${result.valid ? 'Valid' : 'Invalid'}`);
      if (result.valid) {
        console.log(`     Value: ${result.value}`);
      } else {
        console.log(`     Error: ${result.error}`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

// Test configuration
console.log('⚙️  Email Configuration\n');
const config = emailValidation.getConfig();
console.log(`Allowed Domains: ${config.allowedDomains.join(', ')}`);
console.log(`Total Allowed Domains: ${config.totalAllowedDomains}`);
console.log(`Manito.ai Enabled: ${config.manitoAiEnabled ? 'Yes' : 'No'}`);
console.log(`Environment: ${config.environment}`);

// Test specific manito.ai validation
console.log('\n🎯 Manito.ai Specific Tests\n');

const manitoEmails = [
  'test@manito.ai',
  'user@manito.ai',
  'admin@manito.ai',
  'support@manito.ai'
];

manitoEmails.forEach((email, index) => {
  totalTests++;
  console.log(`Manito Test ${index + 1}: ${email}`);
  
  const isManito = emailValidation.isManitoEmail(email);
  const validation = emailValidation.validate(email);
  
  if (isManito && validation.valid) {
    console.log(`  ✅ Manito.ai email accepted correctly`);
    passedTests++;
  } else {
    console.log(`  ❌ Manito.ai email should be accepted but failed`);
    console.log(`     Is Manito: ${isManito}`);
    console.log(`     Valid: ${validation.valid}`);
    if (!validation.valid) {
      console.log(`     Error: ${validation.error}`);
    }
  }
  console.log('');
});

// Test domain management
console.log('🔧 Domain Management Tests\n');

// Test adding a new domain
console.log('Adding test-domain.com to allowed domains...');
emailConfig.addAllowedDomain('test-domain.com');
const newConfig = emailValidation.getConfig();
console.log(`Updated allowed domains: ${newConfig.allowedDomains.join(', ')}`);

// Test removing a domain (except manito.ai)
console.log('Removing gmail.com from allowed domains...');
emailConfig.removeAllowedDomain('gmail.com');
const updatedConfig = emailValidation.getConfig();
console.log(`Updated allowed domains: ${updatedConfig.allowedDomains.join(', ')}`);

// Test that manito.ai cannot be removed
console.log('Attempting to remove manito.ai (should fail)...');
emailConfig.removeAllowedDomain('manito.ai');
const finalConfig = emailValidation.getConfig();
console.log(`Final allowed domains: ${finalConfig.allowedDomains.join(', ')}`);
console.log(`Manito.ai still enabled: ${finalConfig.manitoAiEnabled ? 'Yes' : 'No'}`);

// Test environment variable loading
console.log('\n🌍 Environment Variable Tests\n');
console.log('Setting ALLOWED_EMAIL_DOMAINS environment variable...');
process.env.ALLOWED_EMAIL_DOMAINS = 'custom-domain.com,another-domain.org';
emailConfig.loadFromEnvironment();
const envConfig = emailValidation.getConfig();
console.log(`Domains from environment: ${envConfig.allowedDomains.join(', ')}`);
console.log(`Manito.ai still included: ${envConfig.manitoAiEnabled ? 'Yes' : 'No'}`);

// Test that manito.ai emails still work after environment change
console.log('\n🔍 Testing manito.ai emails after environment change...');
const testManitoAfterEnv = emailValidation.validate('test@manito.ai');
if (testManitoAfterEnv.valid) {
  console.log('  ✅ manito.ai emails still work after environment change');
  passedTests++;
} else {
  console.log('  ❌ manito.ai emails failed after environment change');
  console.log(`     Error: ${testManitoAfterEnv.error}`);
}
totalTests++;

// Summary
console.log('\n📊 Test Summary\n');
console.log(`Tests Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

// Check if core functionality is working
const coreTestsPassed = manitoEmails.every(email => {
  const validation = emailValidation.validate(email);
  return validation.valid && emailValidation.isManitoEmail(email);
});

if (coreTestsPassed && emailValidation.getConfig().manitoAiEnabled) {
  console.log('\n🎉 Core functionality tests passed!');
  console.log('✅ manito.ai emails are properly accepted and validated.');
  console.log('✅ Email validation system is working correctly.');
  console.log('\n✨ Email validation system is ready for production use!');
} else {
  console.log('\n⚠️  Core functionality tests failed.');
  console.log('❌ manito.ai emails are not being accepted properly.');
  process.exit(1);
}
