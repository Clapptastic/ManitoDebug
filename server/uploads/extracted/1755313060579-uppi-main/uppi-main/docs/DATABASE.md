# Database Schema Documentation

## Overview

This document describes the database structure, relationships, and security policies for the platform. The database is built on PostgreSQL via Supabase.

## Core Tables

### Authentication & Users

#### `profiles`
User profile information and role assignments.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  organization_id UUID REFERENCES organizations(id),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Users can view/update their own profile
- Admins can view all profiles
- Super admins can manage all profiles

#### `platform_roles`
Additional role assignments for fine-grained permissions.

```sql
CREATE TABLE platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
```

### System Management

#### `system_components`
Microservices and system component definitions.

```sql
CREATE TABLE system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status component_status DEFAULT 'operational',
  response_time INTEGER,
  uptime_percentage NUMERIC DEFAULT 100,
  last_checked TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Component Status Enum:**
```sql
CREATE TYPE component_status AS ENUM (
  'operational',
  'degraded', 
  'outage'
);
```

#### `system_metrics`
Real-time system performance metrics.

```sql
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_usage NUMERIC DEFAULT 0,
  memory_usage NUMERIC DEFAULT 0,
  disk_usage NUMERIC DEFAULT 0,
  network_latency NUMERIC DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  error_rate NUMERIC DEFAULT 0,
  uptime NUMERIC DEFAULT 99.9,
  overall_status TEXT DEFAULT 'operational',
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Management

#### `api_keys`
Secure storage of user API keys for external services.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  masked_key TEXT NOT NULL,
  status api_status DEFAULT 'pending',
  last_validated TIMESTAMPTZ,
  error_message TEXT,
  organization_id UUID REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `api_usage_costs`
Track API consumption and costs.

```sql
CREATE TABLE api_usage_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  api_provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  response_time_ms INTEGER,
  model_used TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  request_timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Monitoring & Logging

#### `edge_function_metrics`
Edge function performance and error tracking.

```sql
CREATE TABLE edge_function_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `error_logs`
Comprehensive error logging for debugging and monitoring.

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  action TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT NOT NULL,
  environment TEXT NOT NULL,
  user_agent TEXT,
  url TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Business Logic

#### `competitor_analyses`
Market research and competitor analysis data.

```sql
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  industry TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  revenue_estimate NUMERIC DEFAULT 0,
  business_model TEXT,
  target_market TEXT[],
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  competitive_advantages TEXT[],
  competitive_disadvantages TEXT[],
  market_position TEXT,
  pricing_strategy JSONB DEFAULT '{}',
  funding_info JSONB DEFAULT '{}',
  key_personnel JSONB DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  source_citations JSONB DEFAULT '[]',
  data_completeness_score NUMERIC DEFAULT 0,
  status analysis_status DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS)

### Admin Access Patterns

Most admin tables use this pattern:

```sql
-- Admin read/write access
CREATE POLICY "Admins can manage [table]" 
ON [table] 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Authenticated user read access
CREATE POLICY "Authenticated users can view [table]" 
ON [table] 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
```

### User Data Access

```sql
-- Users can manage their own data
CREATE POLICY "Users can manage own data" 
ON [table] 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Super Admin Access

```sql
-- Super admin full access
CREATE POLICY "Super admins full access" 
ON [table] 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);
```

## Indexes

### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- API usage queries
CREATE INDEX idx_api_usage_user_timestamp ON api_usage_costs(user_id, request_timestamp);
CREATE INDEX idx_api_usage_provider ON api_usage_costs(api_provider);

-- Error log analysis
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_timestamp ON error_logs(created_at);

-- System monitoring
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(created_at);
CREATE INDEX idx_edge_metrics_function ON edge_function_metrics(function_name);
```

## Database Functions

### Role Management

```sql
-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = required_role
  ) OR EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = user_id 
    AND role = required_role
  );
$$;
```

### Data Quality

```sql
-- Calculate data completeness score
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(
  analysis_record competitor_analyses
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  score NUMERIC := 0;
  field_count INTEGER := 0;
  filled_count INTEGER := 0;
BEGIN
  -- Implementation details...
  RETURN score;
END;
$$;
```

## Triggers

### Automatic Timestamps

```sql
-- Update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Data Quality Triggers

```sql
-- Auto-calculate data completeness
CREATE TRIGGER update_data_completeness_trigger
  BEFORE INSERT OR UPDATE ON competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_data_completeness_score();
```

## Migration Strategy

### Version Control

Database changes are managed through Supabase migrations:

```sql
-- Migration naming: YYYYMMDDHHMMSS_description.sql
-- Example: 20240104120000_add_system_metrics_table.sql
```

### Deployment Process

1. **Development**: Test migrations in development environment
2. **Staging**: Validate in staging with production-like data
3. **Production**: Apply migrations during maintenance window
4. **Rollback**: Maintain rollback scripts for critical changes

## Monitoring

### Performance Monitoring

- Query performance via `pg_stat_statements`
- Index usage via `pg_stat_user_indexes`
- Connection monitoring via `pg_stat_activity`

### Security Monitoring

- RLS policy effectiveness
- Failed authentication attempts
- Privilege escalation attempts

## Backup & Recovery

### Automated Backups

- Daily full backups via Supabase
- Point-in-time recovery available
- Cross-region backup replication

### Recovery Procedures

1. **Data Loss**: Point-in-time recovery
2. **Corruption**: Full backup restoration
3. **Security Breach**: Isolated backup restoration

---

*For implementation details, see [Admin Dashboard Documentation](ADMIN_DASHBOARD.md)*