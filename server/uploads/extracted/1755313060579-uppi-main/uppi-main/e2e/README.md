# AI Entrepreneur Platform - E2E Tests

This directory contains comprehensive end-to-end tests for the AI Entrepreneur Platform using Playwright.

## Test Structure

### 📁 Test Files

- **`auth.spec.ts`** - Authentication flow tests (login, signup, redirects)
- **`features.spec.ts`** - Core feature tests (competitor analysis, API keys)
- **`user-features.spec.ts`** - User-facing features (documents, chatbot, settings)
- **`admin.spec.ts`** - Admin panel and affiliate management tests
- **`responsive-and-performance.spec.ts`** - Mobile responsiveness, performance, error handling

### 🧪 Test Coverage

#### Authentication & Authorization
- ✅ Unauthenticated user redirects
- ✅ Login form validation
- ✅ Signup navigation
- ✅ Admin access control
- ✅ Role-based permissions

#### Core Features
- ✅ Dashboard navigation and stats
- ✅ Competitor analysis workflow
- ✅ API keys management
- ✅ Document storage and upload
- ✅ AI chatbot interface

#### Admin Features
- ✅ Admin panel access
- ✅ Affiliate link management
- ✅ User management
- ✅ Super admin permissions

#### User Experience
- ✅ Mobile responsiveness
- ✅ Cross-browser compatibility
- ✅ Loading states
- ✅ Error handling
- ✅ Performance benchmarks

## Running Tests

### Prerequisites
```bash
# Install Playwright browsers
npm run test:e2e:install
```

### Run Tests
```bash
# Run all tests headless
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- auth.spec.ts

# View test report
npm run test:e2e:report
```

### Test Configuration

The tests are configured to run on:
- ✅ **Desktop**: Chrome, Firefox, Safari
- ✅ **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)
- ✅ **CI/CD**: Optimized for continuous integration

### Mock Data Strategy

Tests use localStorage mocking for authentication:
```javascript
await page.addInitScript(() => {
  window.localStorage.setItem('supabase.auth.token', JSON.stringify({
    access_token: 'mock-token',
    user: { id: 'test-user-id', email: 'test@example.com' }
  }));
});
```

### Test Data Isolation

Each test:
- ✅ Starts with clean localStorage
- ✅ Uses predictable mock data
- ✅ Doesn't affect other tests
- ✅ Cleans up after execution

## Best Practices

1. **Page Object Pattern**: Reusable page interactions
2. **Wait Strategies**: Proper element waiting
3. **Error Assertions**: Comprehensive error checking
4. **Mobile-First**: Responsive design testing
5. **Performance**: Load time monitoring

## CI/CD Integration

Tests are configured for CI environments:
- Retry failed tests 2x
- Generate HTML reports
- Capture screenshots on failure
- Trace collection for debugging

## Debugging

When tests fail:
1. Check the HTML report: `npm run test:e2e:report`
2. View screenshots in `test-results/`
3. Use debug mode: `npm run test:e2e:debug`
4. Enable tracing for detailed analysis