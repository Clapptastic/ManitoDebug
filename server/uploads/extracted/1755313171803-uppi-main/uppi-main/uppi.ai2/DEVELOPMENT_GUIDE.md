
# Development Guide

## Introduction

This guide provides comprehensive instructions for setting up, developing, and contributing to the Uppi.ai 2.0 platform. It covers development environment setup, coding standards, testing practices, and release procedures.

## Development Environment Setup

### Prerequisites

- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Git
- Supabase CLI
- Docker (for local Supabase development)
- VS Code (recommended)

### Environment Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/uppi-ai/uppi-platform.git
   cd uppi-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up local Supabase**
   ```bash
   supabase start
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local Supabase URL and anon key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── app/                # App routes
│   ├── components/         # React components
│   │   ├── ui/             # UI components (shadcn/ui)
│   │   ├── market-research/# Market research components
│   │   ├── layouts/        # Layout components
│   │   └── ...
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and libraries
│   ├── services/           # API services and integrations
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── supabase/
│   ├── functions/          # Edge Functions
│   ├── migrations/         # Database migrations
│   └── seed/               # Seed data
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
└── docs/                   # Documentation
```

## Coding Standards

### General Guidelines

1. **TypeScript**: Use TypeScript for all new code.
2. **ESLint & Prettier**: Follow the project's ESLint and Prettier configurations.
3. **Components**: Create focused, reusable components.
4. **Comments**: Document complex logic and component APIs.
5. **File Organization**: Group related code into logical directories.

### TypeScript Best Practices

1. **Strict Type Safety**: Leverage TypeScript's type system fully.
2. **Avoid `any`**: Use specific types or `unknown` with type guards instead.
3. **Type Definitions**: Define types in dedicated files for complex structures.
4. **Interfaces vs Types**: Use interfaces for objects and types for unions/primitives.
5. **Type Guards**: Implement type guards for runtime type checking.

### React Patterns

1. **Functional Components**: Use functional components with hooks.
2. **Custom Hooks**: Extract reusable logic to custom hooks.
3. **Context API**: Use Context for global state when needed.
4. **Memoization**: Use `useMemo` and `useCallback` for performance optimization.
5. **Error Boundaries**: Implement error boundaries for resilient UIs.

### CSS and Styling

1. **Tailwind CSS**: Use Tailwind utility classes for styling.
2. **Component Library**: Leverage shadcn/ui components when possible.
3. **Responsive Design**: Ensure all UIs are responsive using Tailwind's responsive classes.
4. **Dark Mode**: Support light and dark mode using the design system.

## Git Workflow

1. **Main Branch**: The `main` branch contains the production code.
2. **Development Branch**: The `development` branch is the integration branch.
3. **Feature Branches**: Create feature branches from `development` with the naming convention `feature/feature-name`.
4. **Bug Fix Branches**: Create bug fix branches with the naming convention `fix/bug-name`.
5. **Pull Requests**: Submit PRs to the `development` branch with comprehensive descriptions.

### Commit Message Format

Follow the Conventional Commits specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(competitor-analysis): add AI provider selection

- Added multi-provider selection UI
- Implemented toggle functionality
- Updated API integration to support multiple providers

Closes #123
```

## Testing Strategy

### Unit Testing

- Use Jest and React Testing Library for unit tests
- Test individual components and utilities
- Focus on behavior, not implementation details
- Use mocks for external dependencies

Example unit test:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button component', () => {
  it('renders correctly with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Testing

- Test interactions between components
- Focus on user flows and feature functionality
- Use MSW for API mocking

### End-to-End Testing

- Test complete user journeys
- Use Playwright for E2E tests
- Focus on critical paths and user workflows

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Supabase Integration

### Database Migrations

Create and apply migrations using the Supabase CLI:

```bash
# Create a new migration
supabase migration new migration_name

# Apply migrations to local Supabase instance
supabase db reset

# Generate types from database schema
supabase gen types typescript --local > src/types/supabase.ts
```

### Edge Functions

Develop and deploy Edge Functions:

```bash
# Create a new Edge Function
supabase functions new function_name

# Run Edge Function locally
supabase functions serve function_name --env-file .env.local

# Deploy Edge Function
supabase functions deploy function_name
```

## Deployment

### Staging Deployment

1. Merge PR to `development` branch
2. Automatic deployment to staging environment
3. Run automated tests against staging
4. Perform manual QA as needed

### Production Deployment

1. Create a PR from `development` to `main`
2. Review and approve the PR
3. Merge to `main` branch
4. Automatic deployment to production
5. Verify deployment with smoke tests

## Debugging

### Frontend Debugging

1. Use React DevTools for component inspection
2. Use the browser's DevTools for network and performance analysis
3. Implement comprehensive logging for critical user flows

### Backend Debugging

1. Use Supabase Dashboard for database monitoring
2. Check Edge Function logs in the Supabase Dashboard
3. Implement structured logging in Edge Functions

## Performance Optimization

1. **Code Splitting**: Use dynamic imports for large components
2. **Image Optimization**: Optimize images and use proper formats
3. **Memoization**: Use React.memo, useMemo, and useCallback appropriately
4. **Bundle Analysis**: Regularly analyze bundle size with `npm run analyze`
5. **Database Optimization**: Use indexes and optimize queries

## Accessibility Guidelines

1. Use semantic HTML elements
2. Ensure keyboard navigability
3. Implement proper ARIA attributes
4. Support screen readers
5. Maintain adequate color contrast

## Security Best Practices

1. **Authentication**: Use Supabase Auth for secure authentication
2. **Authorization**: Implement Row Level Security (RLS) in Supabase
3. **API Keys**: Secure storage of third-party API keys
4. **XSS Prevention**: Avoid dangerouslySetInnerHTML when possible
5. **CSRF Protection**: Implement CSRF tokens for sensitive operations

## Documentation

1. **Code Documentation**: Document complex logic and component APIs
2. **API Documentation**: Document API endpoints and parameters
3. **README**: Keep README up to date with setup instructions
4. **Wiki**: Use GitHub wiki for detailed documentation
5. **Storybook**: Document UI components with Storybook

## Troubleshooting Common Issues

### Supabase Connection Issues

- Check if Supabase is running locally with `supabase status`
- Verify your environment variables are correct
- Try restarting the Supabase container with `supabase restart`

### Build Errors

- Clear npm cache with `npm cache clean --force`
- Delete node_modules and reinstall dependencies
- Check TypeScript errors with `npm run type-check`

### Testing Issues

- Verify you have the latest test dependencies
- Check for environment-specific test failures
- Ensure mocks are properly set up for external dependencies
