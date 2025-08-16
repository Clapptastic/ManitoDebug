
# Testing Guide

## Overview

This document outlines the testing strategy, methodologies, and best practices for the Uppi.ai 2.0 platform. It covers unit testing, integration testing, end-to-end testing, and performance testing approaches.

## Testing Philosophy

Uppi.ai 2.0 follows these core testing principles:

1. **Test-Driven Development**: Write tests before implementation when possible
2. **Comprehensive Coverage**: Aim for high test coverage of critical features
3. **Quality over Quantity**: Focus on high-value tests that ensure functionality
4. **Automation First**: Automate tests whenever possible
5. **Fast Feedback**: Optimize test speed for developer productivity

## Test Types

### Unit Tests

Unit tests verify individual components and functions in isolation.

**Framework**: Jest + React Testing Library

**Key Focus Areas**:
- React components
- Utility functions
- Custom hooks
- Data transformations
- State management logic

**Best Practices**:
- Test behavior, not implementation details
- Use descriptive test names following the pattern: "it should [expected behavior] when [condition]"
- Mock external dependencies
- Keep tests fast and focused

**Example Unit Test**:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiToggle } from '@/components/market-validation/competitor-analysis/ApiToggle';

describe('ApiToggle component', () => {
  const defaultProps = {
    type: 'openai',
    checked: false,
    onChange: jest.fn(),
    hasKey: true
  };

  it('renders correctly with provider name', () => {
    render(<ApiToggle {...defaultProps} />);
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('shows available badge when hasKey is true', () => {
    render(<ApiToggle {...defaultProps} hasKey={true} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('shows missing badge when hasKey is false', () => {
    render(<ApiToggle {...defaultProps} hasKey={false} />);
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });

  it('calls onChange when toggled', async () => {
    const onChange = jest.fn();
    render(<ApiToggle {...defaultProps} onChange={onChange} />);
    
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disables toggle when hasKey is false', () => {
    render(<ApiToggle {...defaultProps} hasKey={false} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
```

### Integration Tests

Integration tests verify the interaction between multiple components or systems.

**Framework**: Jest + React Testing Library + MSW

**Key Focus Areas**:
- Component compositions
- API interactions
- Data flow between components
- Context providers and consumers

**Best Practices**:
- Mock external APIs with MSW
- Test realistic user flows
- Create fixtures for common test data
- Use test IDs for complex component selections

**Example Integration Test**:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { CompetitorAnalysisForm } from '@/components/market-validation/competitor-analysis/CompetitorAnalysisForm';
import { ApiKeyProvider } from '@/contexts/api-keys/ApiKeyContext';

// Mock API server
const server = setupServer(
  rest.post('/api/v1/competitor-analysis', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: { id: 'test-id', status: 'pending' },
        error: null
      })
    );
  }),
  
  rest.get('/api/v1/api-keys', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          { id: '1', api_type: 'openai', status: 'valid' },
          { id: '2', api_type: 'anthropic', status: 'valid' }
        ],
        error: null
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CompetitorAnalysisForm integration', () => {
  it('submits form with correct data and shows success message', async () => {
    const onSuccess = jest.fn();
    
    render(
      <ApiKeyProvider>
        <CompetitorAnalysisForm onSuccess={onSuccess} />
      </ApiKeyProvider>
    );
    
    // Fill out form
    await userEvent.type(
      screen.getByLabelText(/competitor name/i),
      'Test Competitor'
    );
    
    await userEvent.type(
      screen.getByLabelText(/website/i),
      'https://example.com'
    );
    
    // Select API providers
    await userEvent.click(screen.getByText('OpenAI'));
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }));
    
    // Verify success
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-id' })
      );
    });
    
    expect(screen.getByText(/analysis started/i)).toBeInTheDocument();
  });
});
```

### End-to-End Tests

E2E tests verify complete user journeys across the entire application.

**Framework**: Playwright

**Key Focus Areas**:
- Critical user flows
- Multi-step processes
- Authentication and authorization
- Cross-page interactions

**Best Practices**:
- Focus on critical business flows
- Use realistic test data
- Test across multiple browsers
- Isolate tests with unique test data

**Example E2E Test**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Competitor Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify login success
    await expect(page).toHaveURL('/dashboard');
  });

  test('can create and view a competitor analysis', async ({ page }) => {
    // Navigate to competitor analysis page
    await page.click('text=Market Research');
    await page.click('text=Competitor Analysis');
    
    // Create new analysis
    await page.click('button:has-text("New Analysis")');
    await page.fill('input[name="name"]', 'Test Analysis');
    await page.fill('textarea[name="description"]', 'Test Description');
    
    // Add competitor
    await page.click('button:has-text("Add Competitor")');
    await page.fill('input[name="competitor_name"]', 'Competitor A');
    await page.fill('input[name="website"]', 'https://example.com');
    await page.click('button:has-text("Add")');
    
    // Select API providers
    await page.click('[data-testid="api-toggle-openai"]');
    
    // Start analysis
    await page.click('button:has-text("Start Analysis")');
    
    // Verify analysis started
    await expect(page.locator('text=Analysis in progress')).toBeVisible();
    
    // Navigate to analysis details (simulating completion)
    await page.goto('/market-research/competitor-analysis');
    await page.click('text=Test Analysis');
    
    // Verify analysis details page
    await expect(page).toHaveURL(/\/market-research\/competitor-analysis\/details\/\w+/);
    await expect(page.locator('h1')).toContainText('Test Analysis');
    await expect(page.locator('text=Competitor A')).toBeVisible();
  });
});
```

### Accessibility Tests

Accessibility tests ensure the application is usable by everyone.

**Frameworks**: jest-axe, Playwright Accessibility

**Key Focus Areas**:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

**Example Accessibility Test**:

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CompetitorCard } from '@/components/market-validation/competitor-analysis/CompetitorCard';

expect.extend(toHaveNoViolations);

describe('CompetitorCard accessibility', () => {
  it('should not have accessibility violations', async () => {
    const competitor = {
      id: '1',
      name: 'Test Competitor',
      website: 'https://example.com',
      strengthsCount: 3,
      weaknessesCount: 2
    };
    
    const { container } = render(
      <CompetitorCard
        competitor={competitor}
        onSelect={jest.fn()}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Performance Tests

Performance tests measure the application's speed, responsiveness, and stability.

**Frameworks**: Lighthouse CI, webpack-bundle-analyzer

**Key Focus Areas**:
- Page load time
- Time to Interactive
- Bundle size
- Component render performance
- API response time

**Example Performance Test**:

```typescript
import { render } from '@testing-library/react';
import { measureRenderTime } from '@/utils/test/performance';
import { CompetitorAnalysisResults } from '@/components/market-validation/competitor-analysis/CompetitorAnalysisResults';
import { largeResultsFixture } from '@/test/fixtures/competitor-analysis';

describe('CompetitorAnalysisResults performance', () => {
  it('renders large result sets efficiently', async () => {
    const renderTime = await measureRenderTime(() => {
      render(
        <CompetitorAnalysisResults
          results={largeResultsFixture}
          isLoading={false}
        />
      );
    });
    
    // Render should complete in under 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

## Testing Infrastructure

### CI/CD Testing Pipeline

**Pipeline Stages**:
1. **Linting & Type Checking**: ESLint, TypeScript
2. **Unit & Integration Tests**: Jest
3. **Build Verification**: Ensure build succeeds
4. **E2E Tests**: Playwright on key browsers
5. **Performance Tests**: Lighthouse CI
6. **Deployment**: Deploy if all tests pass

**Branch Strategies**:
- Run full test suite for PRs to main branches
- Run subset of tests for feature branches
- Schedule nightly comprehensive test runs

### Test Environment Management

**Environment Types**:
- **Local**: Developer machines
- **CI**: Continuous Integration environment
- **Staging**: Pre-production environment
- **Production**: Live environment

**Environment Variables**:
- Use `.env.test` for test-specific configuration
- Mock external services in test environments
- Use test accounts for third-party services

## Test Data Management

### Test Fixtures

Centralize test data in fixtures:

```typescript
// /src/test/fixtures/competitor-analysis.ts
export const competitorFixture = {
  id: 'test-id',
  name: 'Test Competitor',
  website: 'https://example.com',
  strengths: ['Quality 1', 'Quality 2'],
  weaknesses: ['Weakness 1', 'Weakness 2'],
  createdAt: '2023-01-01T00:00:00Z'
};

export const analysisFixture = {
  id: 'analysis-id',
  name: 'Test Analysis',
  status: 'completed',
  competitors: [competitorFixture],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-02T00:00:00Z'
};
```

### Test Factories

Use factories for generating test data:

```typescript
// /src/test/factories/competitor-factory.ts
import { faker } from '@faker-js/faker';
import { CompetitorData } from '@/types/competitor/types';

export function createCompetitor(overrides = {}): CompetitorData {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    website: faker.internet.url(),
    description: faker.company.catchPhrase(),
    foundedYear: faker.number.int({ min: 1990, max: 2023 }),
    strengths: Array.from({ length: 3 }, () => faker.company.buzzPhrase()),
    weaknesses: Array.from({ length: 3 }, () => faker.company.buzzPhrase()),
    ...overrides
  };
}

export function createCompetitorAnalysis(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: `Analysis of ${faker.company.buzzNoun()}`,
    description: faker.lorem.paragraph(),
    status: 'completed',
    competitors: Array.from({ length: 3 }, () => createCompetitor()),
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  };
}
```

## Mocking

### API Mocking

Use MSW for API mocking:

```typescript
// /src/test/mocks/handlers.ts
import { rest } from 'msw';
import { competitorFixture, analysisFixture } from '../fixtures/competitor-analysis';

export const handlers = [
  rest.get('/api/v1/competitor-analysis', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [analysisFixture],
        error: null
      })
    );
  }),
  
  rest.get('/api/v1/competitor-analysis/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: analysisFixture,
        error: null
      })
    );
  }),
  
  rest.post('/api/v1/competitor-analysis', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        data: {
          id: 'new-analysis-id',
          ...req.body,
          status: 'pending'
        },
        error: null
      })
    );
  })
];
```

### Supabase Mocking

Create Supabase client mocks:

```typescript
// /src/test/mocks/supabase.ts
import { analysisFixture } from '../fixtures/competitor-analysis';

export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  },
  from: jest.fn().mockImplementation((table) => {
    switch (table) {
      case 'competitor_analyses':
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: analysisFixture,
            error: null
          }),
          then: jest.fn().mockResolvedValue({
            data: [analysisFixture],
            error: null
          })
        };
      default:
        return {
          select: jest.fn().mockReturnThis(),
          then: jest.fn().mockResolvedValue({ data: [], error: null })
        };
    }
  }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com' } })
    })
  }
};
```

## Test Reporting

### Coverage Reports

Generate and analyze test coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Visual Regression Testing

Use Playwright for visual regression testing:

```typescript
import { test, expect } from '@playwright/test';

test('competitor card visual regression', async ({ page }) => {
  await page.goto('/test-components?component=CompetitorCard');
  
  // Take screenshot and compare with baseline
  await expect(page).toHaveScreenshot('competitor-card.png', {
    maxDiffPixelRatio: 0.01
  });
});
```

## Debugging Tests

### Debugging Jest Tests

```bash
# Run specific test with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand ComponentName.test.ts
```

### Debugging E2E Tests

```bash
# Run Playwright with headed browser
npx playwright test --headed

# Debug specific test
npx playwright test CompetitorAnalysis.spec.ts --debug
```

## Testing Checklist

### New Feature Testing Checklist

- [ ] Unit tests for all new components and utilities
- [ ] Integration tests for component interactions
- [ ] E2E tests for critical user flows
- [ ] Accessibility tests
- [ ] Performance tests for UI-heavy features
- [ ] Mobile responsiveness tests
- [ ] Error state and edge case tests

### Pull Request Testing Checklist

- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Test coverage maintained or improved
- [ ] Edge cases and error states tested
- [ ] Browser compatibility verified
- [ ] Accessibility compliance checked

## Appendix

### Testing Libraries Reference

- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **MSW**: Mock Service Worker for API mocking
- **Playwright**: End-to-end testing framework
- **jest-axe**: Accessibility testing with Jest
- **faker**: Generate realistic test data

### Common Testing Patterns

- **Arrange-Act-Assert**: Structure tests in three phases
- **Page Object Model**: Encapsulate page details for E2E tests
- **Component Test Wrappers**: Create reusable test harnesses
- **Mock Time**: Control time-based behavior in tests
