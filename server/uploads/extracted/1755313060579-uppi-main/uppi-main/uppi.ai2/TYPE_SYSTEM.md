
# Type System Design

## Overview

Uppi.ai 2.0 implements a comprehensive type system using TypeScript to ensure type safety, improve developer experience, and reduce runtime errors. This document outlines the type system architecture and conventions.

## Core Type Architecture

### Type Hierarchy

```
├── Base Types 
│   ├── Common Types
│   └── Utility Types
├── Domain Types
│   ├── User Types
│   ├── Organization Types
│   ├── API Key Types
│   ├── Competitor Analysis Types
│   ├── Market Research Types
│   └── Document Types
├── API Types
│   ├── Request Types
│   ├── Response Types
│   └── Error Types
└── UI Component Types
    ├── Prop Types
    ├── State Types
    └── Event Types
```

## Base Types

### Common Types

```typescript
// Common ID type
type ID = string;

// Generic status types
type Status = 'pending' | 'active' | 'inactive' | 'error';

// Generic timestamps
interface Timestamps {
  created_at: string;
  updated_at: string;
}
```

### Utility Types

```typescript
// Type to make all properties optional
type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Type to make properties non-nullable
type NonNullable<T> = T extends null | undefined ? never : T;

// Recursive partial types for nested objects
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
```

## Domain Types

### User Types

```typescript
interface User extends Timestamps {
  id: ID;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
}

type UserRole = 'admin' | 'user' | 'guest';
type UserStatus = 'active' | 'inactive' | 'pending';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  email_frequency: 'daily' | 'weekly' | 'never';
}
```

### API Key Types

```typescript
interface ApiKey extends Timestamps {
  id: ID;
  user_id: ID;
  api_type: ApiKeyType;
  status: ApiKeyStatus;
  last_validated: string | null;
  is_valid: boolean;
  error_message?: string;
}

type ApiKeyType = 
  | 'openai' 
  | 'anthropic' 
  | 'perplexity' 
  | 'google' 
  | 'mistral'
  | 'serpapi';

type ApiKeyStatus = 
  | 'valid' 
  | 'invalid' 
  | 'pending' 
  | 'expired';
```

### Competitor Analysis Types

```typescript
interface CompetitorAnalysis extends Timestamps {
  id: ID;
  user_id: ID;
  name: string;
  description?: string;
  status: AnalysisStatus;
  competitors: CompetitorData[];
  settings: AnalysisSettings;
  results: AnalysisResults;
  data_quality_score: number;
}

interface CompetitorData {
  id: ID;
  name: string;
  website?: string;
  description?: string;
  founded_year?: number;
  location?: string;
  size?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  products: Product[];
  market_segments: string[];
}

type AnalysisStatus = 
  | 'draft' 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'failed';

interface AnalysisSettings {
  api_providers: ApiKeyType[];
  depth_level: 'basic' | 'standard' | 'comprehensive';
  include_market_data: boolean;
}

interface AnalysisResults {
  summary: string;
  data_sources: string[];
  market_insights: string[];
  competitive_landscape: string;
  recommendations: string[];
}
```

## API Types

### Request Types

```typescript
interface ApiRequest<T = any> {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: T;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}
```

### Response Types

```typescript
interface ApiResponse<T = any> {
  data: T;
  status: number;
  error: ApiError | null;
}

interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

### Pagination Types

```typescript
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
```

## UI Component Types

### Prop Types

```typescript
interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

### Generic Component Types

```typescript
type ComponentWithChildren<P = {}> = React.FC<P & { children?: React.ReactNode }>;

type ComponentWithoutChildren<P = {}> = React.FC<P & { children?: never }>;
```

## Type Guards and Type Predicates

```typescript
// Type guard for API responses
function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: null } {
  return response.error === null;
}

// Type guard for specific domain types
function isCompetitorAnalysis(data: any): data is CompetitorAnalysis {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'competitors' in data &&
    Array.isArray(data.competitors)
  );
}
```

## Type System Conventions

1. **Naming Convention**:
   - Interfaces for complex objects: `PascalCase`
   - Type aliases for unions and primitives: `PascalCase`
   - Enum names: `PascalCaseEnum`

2. **File Organization**:
   - Domain-specific types in dedicated files (e.g., `userTypes.ts`)
   - Shared utility types in `types/utils.ts`
   - Each feature module has its own types directory

3. **Documentation**:
   - All interfaces and complex types include JSDoc comments
   - Exported types documented with examples where helpful

4. **Type Exports**:
   - Types are exported from a central `index.ts` in each directory
   - Barrel exports used for cleaner imports

5. **Strictness**:
   - TypeScript configured with strict mode enabled
   - `noImplicitAny` enforced
   - `strictNullChecks` enabled
