
# TypeScript Error Resolution Plan

## Overview
This document outlines a systematic approach to resolve all TypeScript build errors in the application. The errors are categorized by type and component, with specific actions for each.

## Error Categories

### 1. Interface Property Mismatches
Several components reference properties that don't exist on their respective interfaces.

### 2. Type Import Inconsistencies
There are mismatches between imported types and their actual definitions.

### 3. Missing Type Exports
Some modules are attempting to import types that aren't exported.

### 4. Interface Implementation Errors
Components are not correctly implementing required interface properties.

### 5. Parameter Type Mismatches
Function parameters don't match their expected types.

## Detailed Resolution Plan

### Phase 1: Fix Interface Definitions

#### AffiliateAlert Interface
- Add missing properties to `AffiliateAlert` interface:
  - `is_dismissed`: boolean
  - `alert_type`: string
  - `program_name`: string

#### AffiliateLink Interface
- Add missing properties to `AffiliateLink` interface:
  - `program_name`: string
  - `affiliate_id`: string (or update references to `affiliate_code`)
  - `link_url`: string
  - `last_checked`: string

#### AdminNavItem Interface
- Add missing properties to `AdminNavItem` interface:
  - `roles`: UserRole[]

#### DirectoryCoverage Interface
- Update `DirectoryCoverage` interface:
  - Add `typedLines` and `totalLines` properties or update references

#### TypeCoverageData Interface
- Update `TypeCoverageData` interface:
  - Add missing properties like `percentage`, `typedFiles`, `totalFiles`

#### ProjectCoverage Interface
- Update `ProjectCoverage` interface:
  - Add missing properties like `overallCoverage`, `lastUpdated`, `filesCovered`, `filesWithIssues`, `typeErrors`

### Phase 2: Fix Type Import and Export Issues

#### Export Missing Types
- Add export for `TypeError` in `@/types/typeCoverage`
- Add export for `formatProviderName` in `@/utils/formatters/stringFormatters`
- Export `ApiKeyFormProps` from `./ApiKeyForm`

#### Standardize Type Imports
- Standardize `ApiProviderStatusInfo` import paths to avoid conflicts
- Align all imports to use consistent paths

### Phase 3: Fix Component and Function Type Implementation

#### AdminSidebar Component
- Ensure `navItems` prop accepts the correct `AdminNavItem[]` type

#### TypeCoverageDashboard Component
- Fix mismatch between `DirectoryCoverage` and `DirectoryCoverageRaw`
- Fix mismatch between `TypeFile` and `FileCoverageRaw`

#### SystemHealthTabs Component
- Fix type issues with `DatabaseData` and `ApiData`
- Ensure `status` property is restricted to allowed values

#### ApiKeyInput Component
- Fix `keyType` parameter to match `ApiKeyType` type

### Phase 4: Update Tests and Add Linting

#### Update Test Files
- Update all test files to reflect current component interfaces
- Ensure test mocks match updated type definitions

#### Add Linting Rules
- Implement strict TypeScript linting rules
- Add pre-commit hooks to check for type errors

### Phase 5: Install Tools for Ongoing Type Safety

#### TypeScript Plugins
- Add `typescript-eslint` for improved linting
- Consider `ts-prune` to identify unused exports

#### Automated Type Checking
- Set up GitHub actions for continuous type checking
- Implement automatic PR checks for type safety

### Implementation Order
1. Update interface definitions first as they affect many components
2. Fix type exports and imports next
3. Update component implementations to match interfaces
4. Add linting and testing improvements
5. Set up automated checks to prevent regressions

## Success Criteria
- Zero TypeScript build errors
- All tests pass
- Linting passes without warnings
- Type consistency across the codebase
