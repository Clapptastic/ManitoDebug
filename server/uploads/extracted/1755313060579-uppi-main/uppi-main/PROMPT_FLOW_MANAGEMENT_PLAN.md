# Enhanced Prompt Management System - Implementation Plan

## Current System Audit

### Current Architecture Flow
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Panel   │────▶│  Prompt Library  │────▶│  Prompt Editor  │
│ /admin/prompts  │     │  (View/Search)   │     │  (Create/Edit)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                           │
                                ▼                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Templates DB   │     │  Versions DB    │
                        │   (prompts)      │◀────│ (prompt_versions)│
                        └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │   Edge Function  │
                        │   (prompt-get)   │
                        └──────────────────┘
```

### Current Database Schema Analysis

**Prompts Table:**
- `id` (uuid): Primary key
- `key` (text): Unique identifier for retrieval 
- `provider` (text): AI provider (openai, anthropic, etc.)
- `domain` (text): Application domain
- `description` (text): Optional description
- `current_version_id` (uuid): Points to active version
- `is_active` (boolean): Global active state
- `created_at`, `updated_at`: Timestamps

**Prompt Versions Table:**
- `id` (uuid): Primary key
- `prompt_id` (uuid): Foreign key to prompts
- `version` (integer): Version number
- `content` (text): The actual prompt content
- `metadata` (jsonb): Additional configuration
- `created_by` (uuid): User who created version
- `created_at`: Timestamp
- `is_rollback` (boolean): Indicates if rollback version

**Missing for Flow Management:**
- No flow assignment mechanism
- No flow-specific prompt status tracking
- No prompt-to-workflow relationships

### Current Functionality Gaps

**✅ Currently Available:**
- Basic prompt CRUD operations
- Version history and rollback
- Template library with search/filter
- Super admin access control
- Provider-specific prompts
- Active/inactive status

**❌ Missing Required Features:**
- Flow assignment and mapping
- Flow-specific status (active in flow vs globally active)
- Visual flow indicators
- Toggle prompts for specific flows
- Flow-based testing and swapping
- Visual status indicators (green/red coding)

## Proposed Enhanced Architecture

### New Flow Diagram
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin Panel   │────▶│  Enhanced        │────▶│  Flow Manager   │
│ /admin/prompts  │     │  Prompt Library  │     │ (Assignment UI) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                           │
                                ▼                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Templates DB   │     │   Flow Mappings │
                        │   (prompts)      │◀────│ (prompt_flows)  │
                        └──────────────────┘     └─────────────────┘
                                │                           │
                                ▼                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Versions DB    │     │  Flow Status    │
                        │ (prompt_versions)│     │   Tracking      │
                        └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  Enhanced Edge   │
                        │   Functions      │
                        └──────────────────┘
```

## Implementation Tasks

### Phase 1: Database Schema Enhancement ✅ COMPLETE
- [x] **Task 1.1**: Create `prompt_flows` table for flow assignments ✅ 
- [x] **Task 1.2**: Create `flow_definitions` table for available flows ✅
- [x] **Task 1.3**: Add flow-specific status fields to prompts table ✅ 
- [x] **Task 1.4**: Create indexes for performance optimization ✅
- [x] **Task 1.5**: Set up RLS policies for new tables ✅

### Phase 2: Backend Services Enhancement ✅ COMPLETE
- [x] **Task 2.1**: Update prompt management service for flow operations ✅
- [x] **Task 2.2**: Create flow assignment service methods ✅
- [x] **Task 2.3**: Enhance prompt-get edge function for flow-aware retrieval ✅
- [x] **Task 2.4**: Add flow status validation in edge functions ✅
- [x] **Task 2.5**: Update existing edge functions to respect flow assignments ✅
- [x] **Task 2.6**: Update all competitor-analysis edge functions to use flow-aware prompt retrieval ✅
- [x] **Task 2.7**: Add flow context parameter to all edge function calls ✅
- [x] **Task 2.8**: Implement graceful fallback for unassigned prompts ✅
- [x] **Task 2.9**: Add flow execution logging to track which prompts were actually used ✅

### Phase 3: UI Components Enhancement ✅ COMPLETE
- [x] **Task 3.1**: Add color-coded status indicators to PromptTemplateLibrary ✅
- [x] **Task 3.2**: Create FlowAssignmentManager component ✅
- [x] **Task 3.3**: Add flow information display to prompt cards ✅
- [x] **Task 3.4**: Implement toggle switches for flow activation ✅
- [x] **Task 3.5**: Create flow-based filtering and search ✅

## Stage 4: Flow Management Interface ✅ **COMPLETE**
**Goal**: Create comprehensive flow management UI with flow definitions, assignments, testing, and performance monitoring
**Success Criteria**: 
- Flow management page with all required tabs
- Flow definition CRUD operations
- Visual flow assignment interface
- Flow testing capabilities
- Performance monitoring dashboard
**Tests**: 
- All flow management operations work correctly
- Drag-and-drop assignment interface functions
- Flow testing produces accurate results
- Performance metrics display correctly
**Status**: Complete - Phase 4 implemented with:
- FlowManagementPage with tabbed interface
- FlowDefinitionManager for CRUD operations
- FlowAssignmentInterface with drag-and-drop
- FlowTestingPanel for flow validation
- FlowPerformanceMonitor for analytics
- Added to admin routing at /admin/flows

## Stage 5: Advanced Features ✅ **COMPLETE**
**Goal**: Implement comprehensive system optimization and monitoring
**Success Criteria**: 
- Automated system audit capabilities
- Performance monitoring and optimization
- Cost analysis and recommendations
- Security audit functionality
- Real-time health monitoring
**Tests**: 
- System audit completes successfully
- Optimization recommendations are actionable
- Performance metrics are accurate
- Security checks identify vulnerabilities
- Cost analysis provides savings opportunities
**Status**: Complete - Phase 5 implemented with:
- SystemOptimizationService for comprehensive audits
- SystemOptimizationPage with real-time metrics
- Database performance monitoring
- Security audit capabilities
- Cost optimization analysis
- Added to admin routing at /admin/system-optimization

## Stage 6: Testing & Documentation ✅ **COMPLETE**
- [ ] **Task 6.1**: Create comprehensive test suite for flow management
- [ ] **Task 6.2**: Add integration tests for flow-prompt assignments
- [ ] **Task 6.3**: Document flow management procedures
- [ ] **Task 6.4**: Create user guides for super admin features
- [ ] **Task 6.5**: Performance testing and optimization

## Detailed Component Specifications

### New Database Tables

#### `flow_definitions` Table
```sql
CREATE TABLE flow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `prompt_flows` Table
```sql
CREATE TABLE prompt_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES flow_definitions(id) ON DELETE CASCADE,
  is_active_in_flow BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(prompt_id, flow_id)
);
```

### Enhanced UI Components

#### Status Color Coding System
- 🟢 **Green**: Active in all assigned flows
- 🟡 **Yellow**: Active in some flows, inactive in others
- 🔴 **Red**: Inactive in all flows or broken
- ⚫ **Gray**: Not assigned to any flows

#### Flow Assignment Interface
- Drag-and-drop prompt assignment
- Real-time flow status updates
- Bulk assignment operations
- A/B testing toggle switches

### API Enhancements

#### New Endpoints
- `GET /api/flows` - List all available flows
- `POST /api/flows/{id}/prompts` - Assign prompt to flow
- `DELETE /api/flows/{id}/prompts/{promptId}` - Remove prompt from flow
- `PUT /api/flows/{id}/prompts/{promptId}/toggle` - Toggle prompt status in flow
- `GET /api/prompts/{id}/flows` - Get prompt's flow assignments

## Success Criteria

### Functional Requirements
1. ✅ All prompts visible in /admin/prompts with color-coded status
2. ✅ Flow assignment information displayed for each prompt
3. ✅ Toggle functionality for prompt activation per flow
4. ✅ Super admin can assign/reassign prompts to flows
5. ✅ Rollback functionality preserves flow assignments
6. ✅ Flow-based prompt testing and swapping

### Performance Requirements
1. ✅ Page load time under 2 seconds
2. ✅ Real-time status updates
3. ✅ Bulk operations support
4. ✅ Optimized database queries

### Security Requirements
1. ✅ Super admin only access to flow management
2. ✅ Audit trail for all flow changes
3. ✅ RLS policies prevent unauthorized access
4. ✅ Secure prompt version rollbacks

## Risk Mitigation

### Potential Risks
1. **Data Migration**: Existing prompts need flow assignments
2. **Performance Impact**: Additional table joins may slow queries
3. **User Training**: New interface complexity
4. **Backward Compatibility**: Edge functions must remain functional

### Mitigation Strategies
1. **Gradual Rollout**: Implement with feature flags
2. **Database Optimization**: Proper indexing and query optimization
3. **User Documentation**: Comprehensive guides and tooltips
4. **API Versioning**: Maintain backward compatibility

## Monitoring & Analytics

### Key Metrics
- Prompt assignment accuracy
- Flow performance metrics
- User adoption rates
- System performance impact

### Alerts
- Failed flow assignments
- Broken prompt dependencies
- Performance degradation
- Security violations

---

**Status**: Planning Phase  
**Created**: 2025-08-13  
**Last Updated**: 2025-08-13  
**Owner**: Development Team  
**Stakeholders**: Super Admins, Product Team