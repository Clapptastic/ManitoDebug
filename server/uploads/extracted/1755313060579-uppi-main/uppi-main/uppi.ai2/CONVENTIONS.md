
# Code Conventions

## Component Naming
- Use PascalCase for component names: `CompetitorAnalysis.tsx`
- Match component name with file name
- Group related components in subdirectories

Examples:
```
components/
  competitor-analysis/
    CompetitorAnalysis.tsx
    components/
      CompetitorInput.tsx
      ResultsVisualization.tsx
```

## Type Naming
- **Interfaces**: Use PascalCase with clear descriptive names
  - Example: `CompetitorData`, `ApiKeyProps`
- **Enums**: Use PascalCase with Enum suffix
  - Example: `AnalysisStepEnum`, `ApiKeyStatusEnum` 
- **Type aliases**: Use PascalCase
  - Example: `ApiKeyType`, `CompetitorStatus`
- **Generic Type Parameters**: Use single uppercase letters or PascalCase
  - Example: `T`, `TData`, `TResponse`

## File Structure
- Group related components in subdirectories
- Keep files under 200 lines when possible
- One component per file
- Use index.ts barrel files for cleaner imports

Example directory structure:
```
src/
  components/
    competitor-analysis/
      index.ts
      CompetitorAnalysis.tsx
      AnalysisSection.tsx
      ResultsSection.tsx
      components/
        CompetitorInput.tsx
        AnalysisProgress.tsx
  hooks/
    useCompetitorAnalysis.ts
    useApiKeys.ts
  services/
    competitorAnalysisService.ts
    apiKeyService.ts
  types/
    competitor/
      index.ts
      core.ts
    api-keys/
      types.ts
```

## Import Order
1. React and framework imports
2. Third-party libraries 
3. Internal components and hooks
4. Utility functions
5. Types and interfaces
6. Assets and styles

Example:
```typescript
// React and framework imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Third-party libraries
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Internal components and hooks
import { Button } from '@/components/ui/button';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';

// Utility functions
import { formatDateTime } from '@/utils/formatters';

// Types and interfaces
import { CompetitorData } from '@/types/competitor';

// Assets and styles
import './styles.css';
```

## Hook Naming and Structure
- Name custom hooks with `use` prefix
- Return values in object form for destructuring
- Group related state and callbacks

Example:
```typescript
export function useCompetitorAnalysis() {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      // Implementation
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  };

  return { 
    competitors, 
    loading, 
    error,
    fetchCompetitors 
  };
}
```

## Component Structure
- Use function components with type annotations
- Destructure props in the function signature
- Group related state together
- Define helper functions above the return statement

Example:
```typescript
interface ButtonProps {
  variant?: 'default' | 'primary';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
```

## State Management
- Use React's Context API for shared state
- Keep contexts focused on specific domains
- Use TypeScript interfaces for context values
- Provide default values for context

Example:
```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: false,
});

export const useAuth = () => useContext(AuthContext);
```

## CSS and Styling
- Use Tailwind CSS utility classes
- Group related styles together
- Use consistent naming for custom classes

Example:
```tsx
<div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-800">Title</h2>
  <p className="text-gray-600">Description text</p>
</div>
```

## Error Handling
- Use try/catch blocks for async operations
- Create specific error types when needed
- Provide user-friendly error messages

Example:
```typescript
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unknown error occurred';
  setError(errorMessage);
}
```

## Type Guards
- Use type guards to narrow types
- Create reusable type guard functions

Example:
```typescript
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

try {
  await fetchData();
} catch (error) {
  if (isApiError(error)) {
    // TypeScript now knows error has code and message properties
    console.log(error.code, error.message);
  }
}
```

## Comments
- Use JSDoc comments for functions, classes and interfaces
- Add inline comments for complex logic
- Keep comments up to date with the code

Example:
```typescript
/**
 * Fetches competitor data from the API
 * @param id The ID of the competitor to fetch
 * @returns Promise resolving to competitor data
 * @throws {ApiError} If the API returns an error
 */
async function fetchCompetitor(id: string): Promise<CompetitorData> {
  // Implementation
}
```

## Testing
- Name test files with `.test.ts(x)` suffix
- Group related tests with describe blocks
- Use clear test descriptions
- Mock external dependencies

Example:
```typescript
describe('CompetitorAnalysis', () => {
  describe('fetchCompetitors', () => {
    it('should return competitor data on successful API call', async () => {
      // Test implementation
    });
    
    it('should handle API errors correctly', async () => {
      // Test implementation
    });
  });
});
```

## Commits
- Use conventional commits format
- Include the relevant scope
- Add ticket numbers when applicable

Examples:
```
feat(competitor-analysis): add competitor filtering functionality
fix(api-keys): correct error handling in validation service
chore(deps): update dependency versions
docs(readme): update setup instructions
```
