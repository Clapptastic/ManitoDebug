
# Type System Architecture

This document explains the organization of the type system in this project.

## Core Structure

The type system is organized in a hierarchical manner:

1. **Core Types**
   - Located in `types-core.ts` files
   - Define basic enums, interfaces, and utility types
   - Act as the "single source of truth" for type definitions

2. **Unified Types**
   - Located in `unified-types.ts` files
   - Import and re-export core types
   - Add more complex interfaces that build on core types

3. **Module Index Files**
   - Re-export all types for easy importing

## Import Best Practices

- Always import from the most specific module:
  - `import { CompetitorData } from '@/types/competitor'` (preferred)
  - `import { ApiKeyTypeEnum } from '@/types/api-keys/api-key-types-core'` (when you need specific enums)

- Avoid circular dependencies:
  - Don't import types directly from components
  - Use type converters in separate utility files

## Type Utilities

- **normalizeApiStatus** - Utility for handling various API status formats
- **convertToCompetitorData** - Convert database records to frontend models
- **convertToCompetitorAnalysis** - Convert analysis data from API to frontend model

## Test Types

- Special test compatibility types are available in `test-compatibility.ts`

## Enum Usage

- Always use the enum type (e.g., `CompetitorStatusEnum`) rather than string literals
- For backward compatibility, type aliases are provided (e.g., `CompetitorStatus`)
