
# Code Conventions

This document outlines the coding conventions, style guide, and best practices for development in this project.

## TypeScript Conventions

### 1. Type Definitions

- **Use explicit typing**: Always specify return types for functions, especially for those exported from a module
- **Avoid using `any`**: Use more specific types like `unknown` instead of `any` when the type is not known
- **Use interfaces for object shapes**: Prefer interfaces for defining object shapes over type aliases
- **Use type aliases for unions and intersections**: Prefer type aliases for union and intersection types
- **Export all types**: All types should be exported from their module to be reusable

```typescript
// Good
export interface User {
  id: string;
  name: string;
  email: string;
}

// Good
export type UserRole = 'admin' | 'user' | 'guest';

// Avoid
function process(data: any): any { /* ... */ }

// Better
function process<T>(data: T): ProcessedResult<T> { /* ... */ }
```

### 2. Naming Conventions

- **Interfaces**: Use PascalCase and prefix with `I` (e.g., `IUser`)
- **Type Aliases**: Use PascalCase (e.g., `UserRole`)
- **Enums**: Use PascalCase and suffix with `Enum` (e.g., `StatusEnum`)
- **Generic Type Parameters**: Use single uppercase letter (e.g., `T`, `U`) or PascalCase with descriptive name (e.g., `TItem`, `TResponse`)
- **Boolean variables**: Use `is`, `has`, or `should` prefix (e.g., `isActive`, `hasPermission`)

### 3. File Organization

- **Type files**: Place types in a dedicated `types` directory, organized by domain
- **One type per file**: For complex types, define one main type per file
- **Barrel exports**: Use index files to re-export types for easier imports

## React Conventions

### 1. Component Structure

- **Functional components**: Use functional components with hooks rather than class components
- **Component folders**: For complex components, use folders with an index.ts file that exports the component
- **Props interface**: Define prop types as an interface named `ComponentNameProps`
- **Component naming**: Use PascalCase for component names and files

```typescript
// UserProfile.tsx
import React from 'react';

interface UserProfileProps {
  user: IUser;
  showDetails: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, showDetails }) => {
  // Component implementation
};
```

### 2. Hooks

- **Custom hooks**: Extract reusable logic into custom hooks prefixed with `use`
- **Hook dependencies**: Always specify dependencies in the dependency array of hooks like useEffect
- **Hook organization**: Keep hooks at the top of component functions

## API and Data Handling

### 1. Service Layer

- **Service pattern**: Use service classes or modules to encapsulate API calls
- **Response typing**: Define explicit types for API responses
- **Error handling**: Implement consistent error handling across all API calls

```typescript
// userService.ts
export interface UserResponse {
  data: IUser | null;
  error: Error | null;
}

export const userService = {
  async getUser(id: string): Promise<UserResponse> {
    try {
      // API call
    } catch (error) {
      // Error handling
    }
  }
};
```

### 2. State Management

- **React Query**: Use React Query for server state management
- **Context API**: Use React Context for global state when appropriate
- **Local state**: Use useState for component-local state

## Testing Conventions

### 1. Unit Tests

- **Test naming**: Name tests following `describe('Component/Function name')` and `it('should do something')`
- **Test coverage**: Aim for at least 80% code coverage
- **Testing hooks**: Use `@testing-library/react-hooks` for testing custom hooks
- **Mocking**: Use jest mock functions and mock implementations

### 2. Component Tests

- **Component testing**: Use React Testing Library for component tests
- **Accessibility testing**: Include accessibility checks in component tests
- **User interaction**: Test user interactions using userEvent from Testing Library

## Code Quality Tools

### 1. ESLint

- **Rules**: Follow the project's ESLint configuration
- **TypeScript-ESLint**: Use TypeScript-specific ESLint rules to enforce type safety
- **No warnings**: Treat warnings as errors in CI/CD pipelines

### 2. Prettier

- **Automatic formatting**: Use Prettier for consistent code formatting
- **Pre-commit hooks**: Run Prettier as part of pre-commit hooks

## Documentation

### 1. Code Comments

- **JSDoc**: Use JSDoc comments for functions and components
- **Complex logic**: Add comments explaining complex business logic
- **TODO comments**: Format TODOs with `// TODO: description (username, date)`

### 2. README Files

- **Component README**: Add README.md files to complex component folders
- **Project documentation**: Keep main README.md updated with setup and development instructions

## Performance Considerations

### 1. React Performance

- **Memoization**: Use React.memo, useMemo, and useCallback appropriately
- **Virtualization**: Use virtualization for long lists (react-window or similar)
- **Code splitting**: Implement code splitting for larger bundles

### 2. Bundle Size

- **Tree shaking**: Ensure imports support tree shaking
- **Lazy loading**: Implement lazy loading for routes and large components
- **Bundle analysis**: Periodically analyze bundle size

## Accessibility

- **ARIA attributes**: Use appropriate ARIA attributes for custom components
- **Keyboard navigation**: Ensure components are navigable via keyboard
- **Color contrast**: Maintain proper color contrast ratios
- **Screen readers**: Ensure compatibility with screen readers

## Version Control

- **Commit messages**: Follow conventional commits format
- **Branch naming**: Use feature/, bugfix/, hotfix/ prefixes for branches
- **Pull requests**: Include detailed descriptions and link to issues

## Continuous Integration

- **Type checking**: Run TypeScript compiler in strict mode
- **Linting**: Run ESLint with --max-warnings=0
- **Testing**: Run all tests with coverage reporting
- **Build verification**: Ensure the project builds without errors
