
# Database Design

## Overview

Uppi.ai 2.0 uses Supabase's PostgreSQL database as its primary data store. This document outlines the database schema, relationships, security policies, and optimization strategies.

## Schema Design

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  bio TEXT,
  website TEXT,
  company_name TEXT,
  job_title TEXT,
  industry TEXT,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_by UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### organization_members
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### Feature-Specific Tables

#### api_keys
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_checked TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, api_type)
);
```

#### competitor_analyses
```sql
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  data_quality_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### competitors
```sql
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES competitor_analyses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  founded_year INT,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### market_size_analyses
```sql
CREATE TABLE market_size_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  industry TEXT,
  tam BIGINT,
  sam BIGINT,
  som BIGINT,
  methodology TEXT,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### price_testing
```sql
CREATE TABLE price_testing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price_points JSONB NOT NULL,
  results JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Relationships

### Entity Relationship Diagram (ERD)

```
users 1──────┐
    │        │
    │        │
    ▼        │
profiles     │
             │
             │
organizations◄────┐
    ▲             │
    │             │
    │             │
organization_members
    │
    │
    │
api_keys         competitor_analyses         documents
    │                   │                         │
    │                   │                         │
    │                   ▼                         │
    └───────────► competitors ◄─────────────────┘
```

## Row Level Security (RLS) Policies

### Example RLS Policies

#### Users Table
```sql
-- Users can only read/update their own data
CREATE POLICY users_select ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY users_update ON users FOR UPDATE 
  USING (auth.uid() = id);
```

#### API Keys Table
```sql
-- Users can only manage their own API keys
CREATE POLICY api_keys_select ON api_keys FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY api_keys_insert ON api_keys FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY api_keys_update ON api_keys FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY api_keys_delete ON api_keys FOR DELETE 
  USING (auth.uid() = user_id);
```

#### Competitor Analyses Table
```sql
-- Users can read/manage their own analyses
CREATE POLICY competitor_analyses_select ON competitor_analyses FOR SELECT 
  USING (auth.uid() = user_id OR 
         auth.uid() IN (SELECT user_id FROM organization_members 
                        WHERE organization_id = competitor_analyses.organization_id));

CREATE POLICY competitor_analyses_insert ON competitor_analyses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY competitor_analyses_update ON competitor_analyses FOR UPDATE 
  USING (auth.uid() = user_id OR 
         (organization_id IS NOT NULL AND 
          auth.uid() IN (SELECT user_id FROM organization_members 
                         WHERE organization_id = competitor_analyses.organization_id AND role = 'admin')));

CREATE POLICY competitor_analyses_delete ON competitor_analyses FOR DELETE 
  USING (auth.uid() = user_id OR 
         (organization_id IS NOT NULL AND 
          auth.uid() IN (SELECT user_id FROM organization_members 
                         WHERE organization_id = competitor_analyses.organization_id AND role = 'admin')));
```

## Indexes

### Performance Indexes

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);

-- Organization members indexes
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);

-- Competitor analyses indexes
CREATE INDEX idx_competitor_analyses_user_id ON competitor_analyses(user_id);
CREATE INDEX idx_competitor_analyses_org_id ON competitor_analyses(organization_id);
CREATE INDEX idx_competitor_analyses_status ON competitor_analyses(status);

-- Competitors indexes
CREATE INDEX idx_competitors_analysis_id ON competitors(analysis_id);
```

## Triggers

### Timestamp Update Triggers

```sql
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Additional triggers for other tables...
```

## Database Functions

### API Key Encryption

```sql
-- Function to securely encrypt API keys
CREATE OR REPLACE FUNCTION encrypt_api_key(key_text TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  encrypted TEXT;
BEGIN
  -- Use pgcrypto extension for encryption
  encrypted := encrypt(key_text::bytea, 
                     (SELECT concat(id::text, created_at::text) FROM users WHERE id = user_id)::bytea, 
                     'aes');
  RETURN encode(encrypted, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt API keys
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  decrypted TEXT;
BEGIN
  -- Decrypt using user-specific key
  decrypted := decrypt(decode(encrypted_key, 'base64'), 
                     (SELECT concat(id::text, created_at::text) FROM users WHERE id = user_id)::bytea, 
                     'aes');
  RETURN decrypted::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Data Migration and Backup Strategy

1. **Incremental Migrations**: Use Supabase migrations for schema changes
2. **Database Backups**: 
   - Daily automated backups
   - Point-in-time recovery
   - Backup verification procedures

3. **Data Archiving**: 
   - Archive stale data after 1 year
   - Maintain analytics data in aggregated form

## Performance Optimization

1. **Query Optimization**:
   - Use explain analyze for complex queries
   - Index frequently queried columns
   - Use materialized views for complex reports

2. **Connection Pooling**:
   - Configure appropriate pool sizes
   - Monitor connection usage

3. **Caching Strategy**:
   - Cache frequently accessed data
   - Implement cache invalidation mechanisms
