
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

## API Status Type Issues

### Issue: Inconsistent ApiStatus properties ✅ FIXED
Files affected:
- `src/components/market-validation/competitor-analysis/api-section/status/ApiStatusText.tsx`
- `src/components/market-validation/competitor-analysis/api-section/status/ApiStatusIcon.tsx`

Problem: Using both `lastChecked` and `last_checked`, both `errorMessage` and `error_message` properties.

Solution:
```typescript
// Standardize on camelCase properties in the ApiStatus type
export type ApiStatus = {
  status: 'pending' | 'active' | 'error' | 'inactive' | 'configured' | 'working' | 'unconfigured';
  lastChecked: string;
  errorMessage?: string;
  isWorking?: boolean;
};

// Then update all components to use only these properties, replacing:
status.last_checked → status.lastChecked
status.error_message → status.errorMessage
```

### Issue: Missing `DataChart` parameter type ✅ FIXED
Files affected:
- `src/components/market-validation/GeographicAnalysis.tsx`
- `src/components/market-validation/MarketForecasting.tsx`
- `src/components/market-validation/PriceTesting.tsx`

Problem: Custom data types not matching the required `Record<string, string | number>[]` for DataChart.

Solution:
```typescript
// Update the data types to extend Record<string, string | number>:
interface RegionData extends Record<string, string | number> {
  region: string;
  marketSize: number;
  growthRate: number;
  competition: number;
}

// Or use type assertion when passing data to DataChart:
<DataChart 
  data={regionData as Record<string, string | number>[]}
  // ... other props
/>
```

## Data Structure Type Issues

### Issue: Empty objects being assigned to required interface types ✅ FIXED
Files affected:
- `src/components/market-validation/competitor-analysis/details/AnalysisContent.tsx`

Problem: Empty objects (`{}`) being assigned to complex interfaces that require specific properties.

Solution:
```typescript
// Create default objects that satisfy the minimum interface requirements:
const emptyCompanyOverview: CompanyOverviewData = {
  description: '',
  founded_year: 0,
  headquarters: '',
  employee_count: { min: 0, max: 0 },
  revenue_range: { min: 0, max: 0, currency: 'USD' },
  leadership: []
};

// Then use these defaults:
company_overview: analysis.company_overview || emptyCompanyOverview,
```

### Issue: SWOT Analysis data type mismatch ✅ FIXED
Files affected:
- `src/components/market-validation/competitor-analysis/details/AnalysisContent.tsx`

Problem: SwotAnalysisData structure doesn't match expected shape in SwotTab component.

Solution:
```typescript
// Create an adapter function to convert between formats:
function adaptSwotData(data: SwotAnalysisData): SwotTabProps {
  return {
    strengths: data.strengths?.map(text => ({ text })) || [],
    weaknesses: data.weaknesses?.map(text => ({ text })) || [],
    opportunities: data.opportunities?.map(text => ({ text })) || [],
    threats: data.threats?.map(text => ({ text })) || [],
    impact_level: {}
  };
}

// Then use:
<SwotTab analysis={adaptSwotData(analysis.swot_analysis || { strengths: [], weaknesses: [], opportunities: [], threats: [] })} />
```

## Component Props Type Issues

### Issue: API Toggle Section component prop mismatch ✅ FIXED
Files affected:
- `src/components/market-validation/competitor-analysis/api-section/ApiToggleSection.tsx`

Problem: `ApiToggleItem` expects different props than what's being passed.

Solution:
```typescript
// Update the ApiToggleItemProps interface to include the api property:
interface ApiToggleItemProps {
  api: ApiKeyType;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  status?: ApiStatus;
  hasKey: boolean;
  model: AIModelConfig;
}
```

### Issue: DistributionTab, MarketTab, etc. accessing undefined properties ✅ FIXED
Files affected:
- Multiple tab components in `src/components/market-validation/competitor-analysis/details/tabs/`

Problem: Accessing properties like `primary_channels` that don't exist on empty objects.

Solution:
```typescript
// Use optional chaining and nullish coalescing:
{distribution_channels?.primary_channels?.map(...) || <EmptyState message="No primary channels found" />}

// Or create type guard functions:
function hasPrimaryChannels(data: any): data is { primary_channels: string[] } {
  return data && Array.isArray(data.primary_channels);
}
```

## Enum and Literal Type Issues

### Issue: Inconsistent enum usage ✅ FIXED
Files affected:
- `src/components/market-validation/competitor-analysis/details/AnalysisContent.tsx`

Problem: Using string literals like "UNKNOWN" which don't match enum types.

Solution:
```typescript
// Update enums to include "unknown" value (lowercase):
export enum CompetitorGrowthStageEnum {
  STARTUP = "startup",
  GROWTH = "growth",
  MATURITY = "maturity",
  DECLINE = "decline",
  UNKNOWN = "unknown"  // add this
}

// Or use proper enum values in the code:
growth_stage: analysis.growth_stage || CompetitorGrowthStageEnum.UNKNOWN,
```

### Issue: SwotTab component badge variant type error ✅ FIXED
Files affected:
- `src/components/market-validation/competitor-analysis/tabs/SwotTab.tsx`

Problem: Passing string values as badge variants when specific literals are required.

Solution:
```typescript
// Create a mapping function for impact levels to badge variants:
function impactToBadgeVariant(impact: string): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch(impact.toLowerCase()) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
}

// Then use:
<Badge variant={impactToBadgeVariant(item.impact || 'medium')}>
```

## Incorrect Property Access

### Issue: Accessing non-existent properties on ApiStatus ✅ FIXED
Files affected:
- Multiple API status components

Problem: Accessing `last_checked` instead of `lastChecked`.

Solution:
```typescript
// Use proper property names:
status.lastChecked instead of status.last_checked
status.errorMessage instead of status.error_message

// Or use the normalizeApiStatus utility consistently
```

### Issue: Incorrect property access in various tabs ✅ FIXED
Files affected:
- Multiple tab components

Problem: Accessing properties that don't exist on the object type.

Solution:
```typescript
// Use optional chaining and type guards:
{companyOverview?.leadership?.length > 0 && (
  <div>
    {/* Leadership content */}
  </div>
)}
```

## Missing Types

### Issue: Missing generic types in supabase queries ✅ FIXED
Files affected:
- `src/hooks/competitor-analysis/useAnalysisState.ts`
- Various service files

Problem: Missing generic types causing "Type instantiation is excessively deep and possibly infinite"

Solution:
```typescript
// Add explicit type parameters to supabase queries:
const { data, error } = await supabase
  .from<CompetitorAnalysis>('competitor_analyses')
  .select('*')
  .eq('id', id)
  .single();
```

### Issue: Missing interfaces/types ✅ FIXED
Files affected:
- Various files

Problem: Referencing types that don't exist or have been renamed.

Solution:
```typescript
// Create missing interfaces or update imports:
// For example, if CompetitorAnalysisState is missing:
export interface CompetitorAnalysisState {
  competitors: string;
  status: CompetitorStatusEnum;
  progress: number;
  results: CompetitorData[];
  analysisStep: AnalysisStepEnum;
  error?: string;
}
```

## Function Parameter Type Issues

### Issue: Incorrect parameter types in functions ✅ FIXED
Files affected:
- Various utility functions

Problem: Functions receiving parameters of the wrong type.

Solution:
```typescript
// Update function signatures:
function parseJsonRecord<T>(json: unknown, defaultValue: Record<string, unknown> = {}): Record<string, T> {
  // Implementation
}

// Or add type assertions:
parseJsonRecord(data as unknown as Record<string, unknown>)
```

## Record Type Issues

### Issue: Using custom types where Record<string, T> is required ✅ FIXED
Files affected:
- Various files

Problem: Custom types not matching expected Record<string, T> structure.

Solution:
```typescript
// Make interfaces extend Record:
interface MarketIndicators extends Record<string, number> {
  market_size: number;
  market_growth_rate: number;
  // other required properties
}

// Or use type intersections:
type MarketIndicators = {
  market_size: number;
  market_growth_rate: number;
  // other properties
} & Record<string, number>;
```

## Build Configuration Issues

### Issue: Vite PostCSS plugin conflict ✅ FIXED
Files affected:
- `vite.config.ts`

Problem: PostCSS plugin type mismatch.

Solution:
```typescript
// Update the tailwind configuration to use compatible version:
import tailwindcss from 'tailwindcss';

export default defineConfig({
  // ... other configs
  css: {
    postcss: {
      plugins: [
        tailwindcss() as any,
        // other plugins
      ],
    },
  },
});
```

## Next Steps

1. Start by fixing the fundamental type definitions in `/src/types/`.
2. Then update utility functions to handle these types correctly.
3. Finally, fix component props and usage patterns.

Many errors are interconnected, so fixing core type definitions will resolve multiple issues at once.

