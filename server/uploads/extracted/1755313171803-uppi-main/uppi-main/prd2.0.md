# SaaS Platform Rebuild 2.0 - Product Requirements Document

## Project Overview
This document outlines the plan for rebuilding the AI-powered SaaS platform for entrepreneurs from scratch, focusing on improved architecture, performance, and maintainability while preserving existing functionality.

## Current Progress
- [x] Initial assessment of existing codebase
- [x] Type system foundation established
- [x] Fix critical TypeScript errors in core components
- [x] Create consistent interface definitions for Competitor Analysis
- [x] Fix component props typing issues
- [x] Fix API key handling components
- [x] Update progress tracking components
- [x] Update market size data components and types
- [x] Fix SwotItem and related components
- [x] Fix Theme type system
- [x] Add proper PostgrestResponse handling for tests
- [x] Update API props and status handling
- [x] Fix API key enums and status types
- [x] Ensure all SwotItem implementations include required 'text' property
- [x] Fix PostgrestResponse type handling in API operations
- [x] Add missing type definitions for microservices
- [x] Add pricing type definitions
- [x] Enhance type exports for better modularity
- [x] Fix API key components to use proper types
- [x] Fix missing fields in competitor data types
- [x] Update market trends and industry trends interfaces
- [x] Enhance product offerings and pricing types
- [x] Add missing product and market position fields
- [x] Fix inconsistencies between enum values and string literals in API key types
- [x] Improve SwotUtils with robust conversion functions
- [x] Fix compatibility issues between CompetitorData and CompetitorAnalysis
- [x] Fix API key validation button and status display components
- [x] Add proper test helpers for competitor analysis
- [x] Fix authentication hooks and context
- [x] Fix status display components
- [x] Add missing code embedding types and interfaces
- [x] Add microservice type definitions
- [x] Fix Theme types to include unicorn theme
- [x] Make API key input component work with different prop formats
- [x] Add missing ModelAccordionItem component
- [x] Fix API key types across the codebase for consistency
- [x] Update DataAggregationMetrics to include all metrics fields
- [x] Create comprehensive AI model configuration system
- [x] Fix syntax errors in aiModels configuration file
- [x] Implement model strengths and capabilities components
- [x] Improve error handling for API key status fetching
- [x] Fix notification display issues in competitor analysis page
- [x] Create ModelCapabilitiesDisplay component for better UI presentation
- [x] Create ModelComparisonTable component for comparing AI models
- [x] Create ModelComparisonView component for interactive model selection and comparison
- [x] Update MarketResearchPage to include tabs for different research tools
- [x] Improve CompetitorAnalysisPage to better handle API key status
- [x] Implement comprehensive notification system
- [x] Create API request logging and metrics tracking
- [x] Fix comprehensive TypeScript errors related to CompetitorData interface
- [x] Update interfaces to support both camelCase and snake_case property names for backward compatibility
- [x] Add product pricing related interfaces and types
- [x] Enhance error handling utilities with better error parsing
- [ ] Complete UI component refactoring
- [ ] Implement new file structure
- [ ] Rebuild core services
- [ ] Rebuild database integration
- [ ] Implement improved error handling
- [ ] Integrate enhanced authentication flow
- [ ] Add comprehensive documentation

## Architecture Design

### Frontend Architecture
- **Framework**: Next.js with React 18
- **State Management**: React Query for server state, Zustand for local state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Type Safety**: TypeScript with strict type checking
- **API Integration**: Axios with request/response interceptors
- **Authentication**: Supabase Auth with JWT token management
- **Form Handling**: React Hook Form with Zod validation
- **Charts/Visualizations**: Recharts with reusable chart components

### Backend Architecture
- **Framework**: Supabase for database, authentication, and edge functions
- **API Layer**: RESTful API endpoints with consistent error handling
- **Database**: PostgreSQL with proper indexing and query optimization
- **Caching**: Redis for performance-critical data
- **File Storage**: Supabase Storage for file uploads and management
- **AI Integration**: OpenAI, Anthropic, Google, Perplexity, Mistral APIs

### Modular Structure
- Core modules separated by domain (competitor-analysis, market-research, etc.)
- Shared components and utilities in a common library
- Type definitions centralized for consistency

## Implementation Plan

### Phase 1: Foundation (Completed)
- [x] Establish consistent type system
- [x] Fix critical type errors
- [x] Create test helpers
- [x] Implement utility functions
- [x] Create base components
- [x] Develop AI model configuration system
- [x] Improve error handling for network operations

### Phase 2: Core Services (Current Focus)
- [ ] Authentication flow
- [ ] API key management
- [ ] Competitor analysis
- [ ] Market research
- [ ] Database integration

### Phase 3: UI/UX Enhancement (Planned)
- [ ] Dashboard redesign
- [ ] Result visualization
- [ ] Mobile responsiveness
- [ ] User feedback

### Phase 4: Testing & Documentation
- [ ] Unit tests for core functionality
- [ ] Integration tests
- [ ] Comprehensive documentation
- [ ] User guides

## Type System Enhancements

### Completed Type Improvements
1. **API Key System**: Standardized API key types, enums, and interfaces for consistent usage across all components
2. **Competitor Analysis**: Enhanced competitor data model with comprehensive field definitions and proper nesting
3. **Data Metrics**: Updated metrics interfaces with all required fields and proper typing
4. **Microservices**: Added complete type definitions for microservice configuration and endpoints
5. **UI Components**: Updated component props to ensure type safety and consistency
6. **AI Models**: Created a robust configuration system for AI providers and their capabilities
7. **Type Helpers**: Implemented better type conversion utilities for handling API responses
8. **Error Handling**: Improved error parsing and handling utilities for consistent error messages
9. **Backward Compatibility**: Updated interfaces to support both camelCase and snake_case property naming

### Next Focus Areas
1. **Service Layer**: Ensuring service functions have proper return types and error handling
2. **Authentication**: Completing the auth context and hooks with proper typing
3. **Component Props**: Finalizing missing props types for remaining UI components
4. **Hook Refactoring**: Standardizing hook patterns and return types across the application

## Recent Achievements
- Successfully fixed all syntax errors in the AI model configuration system
- Implemented improved error handling in CompetitorAnalysisPage to prevent excessive error notifications
- Created a new ModelCapabilitiesDisplay component for better visualization of AI model information
- Created a ModelComparisonTable component for comparing capabilities and costs across AI models
- Created a ModelComparisonView component with interactive model selection and detailed comparison view
- Enhanced the MarketResearchPage with tabbed interface for different research tools
- Enhanced the aiModels configuration with complete provider information including capabilities, strengths, and weaknesses
- Fixed issues with ApiKeyStatus display to prevent duplicate notifications and error messages
- Improved the display of API model status information with better visual indicators
- Added better alert messages for users without configured API keys
- Added navigation to API key settings for easier configuration
- Implemented comprehensive notification system using context API and toast integration
- Added API request logging and metrics tracking utilities for better analytics
- Improved error handling with consistent notification patterns
- Fixed comprehensive TypeScript errors in competitor analysis types to support all required properties
- Added robust error parsing utilities for better error messages
- Added pricing-related interfaces and types for better type safety

## Next Steps
- Implement additional AI model visualization components
- Refactor service layer to support the enhanced type system
- Begin work on Phase 2 components starting with improved API key management
- Create UI components to leverage the new AI model configuration system
- Implement better offline capabilities for competitor analysis features
- Develop a unified API console for managing keys and viewing usage metrics
- Implement the Market Demographics analysis tool
- Add support for filtering and detailed view options in model comparison
- Create a Login flow with authentication
- Implement user profile management
