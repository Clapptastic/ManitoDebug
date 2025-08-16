# TypeScript Errors and Suggested Fixes

This document lists all TypeScript errors in the project and provides solutions for fixing them.

## Table of Contents
- [API Status Type Issues](#api-status-type-issues) ✅ FIXED
- [Data Structure Type Issues](#data-structure-type-issues) ✅ FIXED
- [Component Props Type Issues](#component-props-type-issues) ✅ FIXED
- [Enum and Literal Type Issues](#enum-and-literal-type-issues) ✅ FIXED
- [Incorrect Property Access](#incorrect-property-access) ✅ FIXED
- [Missing Types](#missing-types) ✅ FIXED
- [Function Parameter Type Issues](#function-parameter-type-issues) ✅ FIXED
- [Record Type Issues](#record-type-issues) ✅ FIXED
- [Build Configuration Issues](#build-configuration-issues) ✅ FIXED
- [Supabase Integration Type Issues](#supabase-integration-type-issues) 🔄 IN PROGRESS
- [Theme Type Issues](#theme-type-issues) ✅ FIXED
- [SwotItem Type Issues](#swotitem-type-issues) ✅ FIXED
- [MarketSizeData Type Issues](#marketsizedata-type-issues) ✅ FIXED
- [Testing Utilities Type Issues](#testing-utilities-type-issues) 🔄 IN PROGRESS
- [Competitor Analysis Component Types](#competitor-analysis-component-types) ✅ FIXED
- [API Key and Provider Types](#api-key-and-provider-types) ✅ FIXED

## Theme Type Issues

### Issue: Unicorn theme not recognized
Problem: The unicorn theme is used in components but not defined in the Theme type.

Solution:
```typescript
// Update the Theme type to include 'unicorn'
export type Theme = 'light' | 'dark' | 'system' | 'unicorn';
```

## SwotItem Type Issues

### Issue: Missing text property in SwotItem
Problem: SwotItem interface is used but items are created with title/description instead of required text property.

Solution:
```typescript
// Update SwotItem interface
export interface SwotItem {
  text: string;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  impact: ImpactLevelEnum | string;
  title?: string;
  description?: string;
}

// Add helper functions to convert between formats
export function objectsToSwotItems(
  items: { title: string; description: string }[],
  category: 'strength' | 'weakness' | 'opportunity' | 'threat',
  impact: ImpactLevelEnum = ImpactLevelEnum.MEDIUM
): SwotItem[] {
  return items.map(item => ({
    text: item.title,
    category,
    impact,
    title: item.title,
    description: item.description
  }));
}
```

## MarketSizeData Type Issues

### Issue: Incompatible MarketSizeData types
Problem: Different definitions of MarketSizeData across files with incompatible properties.

Solution:
```typescript
// Create consistent MarketSizeData type
export interface MarketSizeData {
  industry: string;
  region: string;
  totalMarketSize: number;
  growthRate: number;
  timeframeYears: number;
  year?: number;
  competitors?: string[] | { name: string; marketShare: number }[];
  segmentation?: Record<string, any>;
  tam?: number;
  sam?: number;
  som?: number;
}
```

## Supabase Integration Type Issues

### Issue: PostgrestResponse usage in tests
Problem: Tests use `PostgrestResponseSuccess<T>` but should use `PostgrestResponse<T>`.

Solution:
```typescript
// Use PostgrestResponse instead of PostgrestResponseSuccess in tests
import { PostgrestResponse } from '@supabase/supabase-js';

// Create a mock response with the correct type
const mockResponse: PostgrestResponse<CompetitorAnalysis[]> = {
  data: [...],
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
};
```

### Issue: Missing fields on complex types
Problem: Some interfaces like CompetitorData and CompetitorAnalysis are missing fields that are used in components.

Solution:
```typescript
export interface CompetitorData {
  // Base properties
  id: string;
  name: string;
  
  // Add missing properties with optional flags
  company_url?: string;
  growth_stage?: CompetitorGrowthStageEnum;
  position_type?: MarketPositionTypeEnum;
  // ... other properties
}
```

## Testing Utilities Type Issues

### Issue: Missing mock helpers for tests
Problem: Tests require properly typed mock data but create inline objects that don't match interface requirements.

Solution:
```typescript
// Create helper functions to generate valid test data
function createMockCompetitorAnalysis(overrides: Partial<CompetitorAnalysis> = {}): CompetitorAnalysis {
  return {
    id: 'test-id',
    name: 'Test Competitor',
    // Include all required fields with defaults
    // ... 
    // Apply any overrides
    ...overrides
  };
}

// Use in tests
const mockAnalysis = createMockCompetitorAnalysis({ status: 'completed' });
```

### Issue: Inconsistent property naming in tests and code
Problem: Tests use camelCase while API responses use snake_case, causing type errors.

Solution:
```typescript
// Create adapter functions to convert between formats
function adaptApiResponseToModel(response: any): CompetitorAnalysis {
  return {
    id: response.id,
    name: response.competitor_name,
    // Map all properties properly
    // ...
  };
}
```

## Competitor Analysis Component Types

### Issue: Incorrect property access in components
Problem: Components trying to access properties that don't exist in the defined types.

Solution:
```typescript
// Updated ProductOfferingData interface
export interface ProductOfferingData {
  name?: string;
  features: string[];
  key_features?: string[];
  differentiators: string[];
  product_lines?: ProductLine[];
  pricing_model?: string | ProductPricing;
  target_audience?: string[] | any;
  target_market?: string[] | any;
  unique_selling_points?: string[];
  main_products?: string[];
}

// Updated MarketPositionData interface
export interface MarketPositionData {
  market_segment: string[] | any;
  market_share: number;
  market_size?: number;
  growth_rate?: number;
  position_type?: MarketPositionTypeEnum;
  target_market?: string;
  positioning_strategy?: string;
  market_trends?: TrendData[];
  competitive_advantage?: string[];
  geographic_presence?: string[];
}
```

## API Key and Provider Types

### Issue: Missing API key and provider types
Problem: Various components and services use API provider types that aren't defined.

Solution:
```typescript
// Added MicroserviceConfig and related types
export interface MicroserviceConfig {
  id: string;
  service_id: string;
  service_name: string;
  service_description?: string;
  base_url: string;
  version: string;
  is_active: boolean;
  is_external: boolean;
  health_check_path?: string;
  swagger_url?: string;
  readme_url?: string;
  endpoints: MicroserviceEndpoint[];
  status: string;
  created_at: string;
  updated_at: string;
}

// Added ApiProviderStatusInfo with all required properties
export interface ApiProviderStatusInfo {
  status: string;
  model?: string;
  timestamp?: string;
  error?: string;
  request_id?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  tokens?: number;
  cost?: number;
}
```

## Type System Modernization Approach

1. **Standardize Base Types**: Define clear base interfaces that are the foundation for all data structures.
2. **Use Type Guards**: Implement proper type guards for safer type narrowing.
3. **Adopt Interface Inheritance**: Use interface inheritance to build complex types from simpler ones.
4. **Provide Factory Functions**: Create factory functions that generate valid objects for each type.
5. **Document Type Constraints**: Add JSDoc comments to explain type constraints and relationships.

## Testing Type Best Practices

1. **Mock Complex Types**: Use helper functions to create valid mock data for tests.
2. **Avoid Type Assertions**: Minimize use of `as` in tests - create properly typed data instead.
3. **Test Type Validators**: Create tests for type guard and validation functions.
4. **Use Type-Safe Mocks**: Ensure mocked services return properly typed responses.

## Implementation Plan

1. ✅ Fix base type definitions
2. ✅ Update component props and usage patterns
3. 🔄 Update service and utility functions to handle these types correctly
4. 🔄 Update test mocks and assertions

## Progress Checklist

- [x] Theme type issues
- [x] SwotItem type issues
- [x] MarketSizeData type issues
- [x] ApiKey and API Status types
- [ ] Competitor Analysis service types
- [ ] Supabase integration types
- [ ] Test utility types
