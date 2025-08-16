# 🤖 AI Agent Execution Guide
## Enterprise-Level Implementation Standards

## 🎯 CRITICAL SUCCESS CRITERIA

### For AI agents executing this plan:
- **NEVER proceed to next task until current task passes all criteria**
- **ALWAYS implement error boundaries and fallbacks**
- **ALWAYS follow TypeScript strict mode**
- **ALWAYS implement loading states**
- **ALWAYS add proper error handling**
- **ALWAYS write unit tests with 95%+ coverage**
- **ALWAYS follow accessibility standards (WCAG 2.1 AA)**
- **ALWAYS implement responsive design (mobile-first)**
- **ALWAYS validate with real user scenarios**

## 🏗️ ARCHITECTURE BEST PRACTICES

### Code Organization (MANDATORY)
```typescript
// ALWAYS follow this exact structure
src/
├── components/           // Reusable UI components
│   ├── ui/              // shadcn/ui components (customized)
│   ├── features/        // Feature-specific components
│   └── layouts/         // Layout components
├── pages/               // Route components
├── services/            // Business logic & API calls
├── hooks/               // Custom React hooks
├── types/               // TypeScript interfaces/types
├── lib/                 // Utilities & configurations
├── contexts/            // React contexts
└── __tests__/           // Test files
```

### Component Standards (MANDATORY)
```typescript
// TEMPLATE: Every component must follow this pattern
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ComponentProps {
  // ALWAYS define explicit prop types
  className?: string;
  children?: React.ReactNode;
  // Add specific props here
}

export const Component: React.FC<ComponentProps> = ({
  className,
  children,
  ...props
}) => {
  // ALWAYS handle loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ALWAYS implement error handling
  const handleAction = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Implementation here
      
      toast.success('Action completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ALWAYS handle error states
  if (error) {
    return (
      <div className="error-state">
        <p>Something went wrong: {error}</p>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* ALWAYS show loading states */}
      {isLoading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        children
      )}
    </div>
  );
};

export default Component;
```

### Service Layer Standards (MANDATORY)
```typescript
// TEMPLATE: Every service must follow this pattern
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  message?: string;
}

export class FeatureService {
  // ALWAYS implement proper error handling
  static async fetchData<T>(query: string): Promise<ServiceResponse<T[]>> {
    try {
      const { data, error } = await supabase
        .from('table_name')
        .select(query);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        message: 'Data fetched successfully'
      };
    } catch (error) {
      console.error('Service error:', error);
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch data'
      };
    }
  }

  // ALWAYS implement optimistic updates where appropriate
  static async updateData<T>(id: string, updates: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      // Optimistic update logic here
      const { data, error } = await supabase
        .from('table_name')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Data updated successfully'
      };
    } catch (error) {
      // Rollback optimistic update if it fails
      console.error('Update failed:', error);
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }
}
```

### React Hook Standards (MANDATORY)
```typescript
// TEMPLATE: Every custom hook must follow this pattern
import { useState, useEffect, useCallback } from 'react';
import { FeatureService, ServiceResponse } from '@/services/featureService';

export interface UseFeatureReturn<T> {
  data: T[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (item: Partial<T>) => Promise<boolean>;
  update: (id: string, updates: Partial<T>) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
}

export const useFeature = <T>(): UseFeatureReturn<T> => {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ALWAYS implement proper cleanup
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await FeatureService.fetchData<T>('*');
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ALWAYS implement CRUD operations
  const create = useCallback(async (item: Partial<T>): Promise<boolean> => {
    try {
      const response = await FeatureService.createData(item);
      if (response.success) {
        await refetch(); // Refresh data
        return true;
      }
      setError(response.error || 'Failed to create item');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      return false;
    }
  }, [refetch]);

  // Similar patterns for update and delete...

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    create,
    update,
    delete
  };
};
```

## 🔒 SECURITY IMPLEMENTATION STANDARDS

### Authentication (MANDATORY)
```typescript
// ALWAYS implement proper auth checks
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// ALWAYS implement role-based access
export const usePermissions = () => {
  const { user } = useAuth();
  
  return useMemo(() => ({
    canCreate: user?.role === 'admin' || user?.role === 'owner',
    canEdit: user?.role !== 'viewer',
    canDelete: user?.role === 'admin' || user?.role === 'owner',
    canManageTeam: user?.role === 'owner'
  }), [user?.role]);
};
```

### Data Validation (MANDATORY)
```typescript
// ALWAYS use Zod for validation
import { z } from 'zod';

export const CreateBusinessPlanSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  team_id: z.string().uuid().optional(),
  plan_data: z.object({}).passthrough(), // Allow any object structure
});

export type CreateBusinessPlanInput = z.infer<typeof CreateBusinessPlanSchema>;

// ALWAYS validate on both client and server
export const validateBusinessPlan = (data: unknown): CreateBusinessPlanInput => {
  return CreateBusinessPlanSchema.parse(data);
};
```

## 🎨 UI/UX STANDARDS

### Design System (MANDATORY)
```typescript
// ALWAYS use semantic design tokens
const designTokens = {
  // Colors - NEVER use direct colors
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
  },
  
  // Spacing - ALWAYS use consistent spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  
  // Typography - ALWAYS use system fonts
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  }
};

// ALWAYS implement responsive design
const ResponsiveComponent = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Mobile-first approach */}
    </div>
  );
};
```

### Accessibility Standards (MANDATORY)
```typescript
// ALWAYS implement ARIA labels and roles
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}> = ({ children, onClick, disabled, loading }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-label={loading ? 'Loading...' : undefined}
      className="focus:ring-2 focus:ring-primary focus:outline-none"
    >
      {loading ? <Spinner aria-hidden="true" /> : children}
    </button>
  );
};

// ALWAYS implement keyboard navigation
export const KeyboardNavigableList: React.FC<{ items: any[] }> = ({ items }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(Math.min(focusedIndex + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(Math.max(focusedIndex - 1, 0));
        break;
    }
  };

  return (
    <ul role="listbox" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={index === focusedIndex ? 0 : -1}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
};
```

## 📊 TESTING STANDARDS

### Unit Testing (MANDATORY)
```typescript
// TEMPLATE: Every component must have tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Component } from './Component';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    render(<Component />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('should handle loading state', async () => {
    render(<Component />);
    
    // Test loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    // Mock error
    vi.mocked(serviceFunction).mockRejectedValue(new Error('Test error'));
    
    render(<Component />);
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong: Test error')).toBeInTheDocument();
    });
  });

  it('should handle user interactions', async () => {
    render(<Component />);
    
    const button = screen.getByRole('button', { name: 'Action' });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Action completed')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing (MANDATORY)
```typescript
// TEMPLATE: Every feature flow must have integration tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestWrapper } from '@/test-utils/TestWrapper';
import { FeaturePage } from './FeaturePage';

describe('Feature Integration', () => {
  it('should complete full user workflow', async () => {
    render(
      <TestWrapper>
        <FeaturePage />
      </TestWrapper>
    );

    // Test full user journey
    const createButton = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(createButton);

    // Fill form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test Item' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Item created successfully')).toBeInTheDocument();
    });

    // Verify item appears in list
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });
});
```

## 🚀 PERFORMANCE STANDARDS

### Performance Requirements (MANDATORY)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s  
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Time to Interactive**: < 3.5s

### Performance Implementation (MANDATORY)
```typescript
// ALWAYS implement lazy loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

export const OptimizedPage = () => {
  return (
    <React.Suspense fallback={<LoadingSkeleton />}>
      <LazyComponent />
    </React.Suspense>
  );
};

// ALWAYS implement memoization for expensive operations
export const ExpensiveComponent = React.memo(({ data }: { data: any[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item));
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});

// ALWAYS implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

export const VirtualizedList = ({ items }: { items: any[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 📝 DOCUMENTATION STANDARDS

### Code Documentation (MANDATORY)
```typescript
/**
 * Business plan management service
 * 
 * Handles CRUD operations for business plans with team collaboration support.
 * Implements optimistic updates and real-time synchronization.
 * 
 * @example
 * ```typescript
 * const service = new BusinessPlanService();
 * const plan = await service.create({
 *   title: 'My Business Plan',
 *   team_id: 'team-123'
 * });
 * ```
 */
export class BusinessPlanService {
  /**
   * Creates a new business plan
   * 
   * @param data - Business plan data
   * @param data.title - The title of the business plan (required)
   * @param data.team_id - Team ID for shared plans (optional)
   * @returns Promise resolving to created business plan
   * 
   * @throws {ValidationError} When required fields are missing
   * @throws {PermissionError} When user lacks create permissions
   */
  async create(data: CreateBusinessPlanInput): Promise<BusinessPlan> {
    // Implementation with proper error handling
  }
}
```

## 🎯 TASK COMPLETION CRITERIA

### Before marking any task as complete, verify:

#### ✅ Code Quality Checklist
- [ ] TypeScript strict mode enabled and no `any` types
- [ ] All components have proper prop types
- [ ] Error boundaries implemented
- [ ] Loading states implemented  
- [ ] Accessibility attributes added
- [ ] Responsive design implemented
- [ ] Performance optimized (lazy loading, memoization)

#### ✅ Testing Checklist  
- [ ] Unit tests written with 95%+ coverage
- [ ] Integration tests for user workflows
- [ ] Accessibility tests pass
- [ ] Performance tests meet targets
- [ ] Error scenarios tested

#### ✅ Security Checklist
- [ ] Input validation implemented
- [ ] Authentication checks in place
- [ ] Authorization properly implemented
- [ ] Sensitive data encrypted
- [ ] RLS policies tested

#### ✅ UX/UI Checklist
- [ ] Mobile-responsive design
- [ ] Loading states provide feedback
- [ ] Error messages are user-friendly
- [ ] Success feedback implemented
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

#### ✅ Production Readiness Checklist
- [ ] Environment variables properly configured
- [ ] Database migrations tested
- [ ] Edge functions deployed
- [ ] Monitoring implemented
- [ ] Documentation updated

## 🚨 FAILURE CONDITIONS

### Immediately fail task if:
- Any TypeScript errors exist
- Tests have less than 95% coverage
- Performance metrics not met
- Accessibility standards violated
- Security vulnerabilities present
- Mobile experience broken
- Error handling missing
- Documentation incomplete

## 📋 SUCCESS VALIDATION

### Each task must pass this validation:
1. **Build**: `npm run build` succeeds with no errors
2. **Tests**: `npm run test` achieves 95%+ coverage
3. **Types**: `npm run type-check` passes
4. **Lint**: `npm run lint` passes
5. **Performance**: Lighthouse score > 90
6. **Accessibility**: axe-core tests pass
7. **Security**: No vulnerabilities in `npm audit`

This guide ensures every AI agent implementation meets enterprise production standards.