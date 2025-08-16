-- CRITICAL SECURITY FIXES

-- 1. Fix microservices table RLS
ALTER TABLE microservices ENABLE ROW LEVEL SECURITY;

-- Drop all existing microservices policies
DROP POLICY IF EXISTS "Super admins can access microservices" ON microservices;

-- Create proper microservices policy
CREATE POLICY "Super admins can manage microservices"
ON microservices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- 2. Fix documents table RLS policies
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create comprehensive documents policies
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all documents"
ON documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Fix profile duplication issue by cleaning up duplicates
-- First, identify and remove duplicate profiles keeping the most recent one
DELETE FROM profiles p1
WHERE p1.ctid < (
  SELECT MAX(p2.ctid)
  FROM profiles p2
  WHERE p2.id = p1.id
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_unique;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_unique UNIQUE (id);

-- 4. Fix database function security by adding proper search_path
CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role::text = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role::text = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- 5. Ensure sample microservice data exists
INSERT INTO microservices (
  name, 
  display_name, 
  description, 
  base_url, 
  version, 
  status, 
  is_active,
  health_check_url,
  created_by
) 
SELECT 
  'ai-competitor-analysis',
  'AI Competitor Analysis Service',
  'Microservice for AI-powered competitor analysis and market research',
  'https://api.example.com/competitor-analysis',
  '1.0.0',
  'active',
  true,
  'https://api.example.com/competitor-analysis/health',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM microservices WHERE name = 'ai-competitor-analysis'
);

INSERT INTO microservices (
  name, 
  display_name, 
  description, 
  base_url, 
  version, 
  status, 
  is_active,
  health_check_url,
  created_by
) 
SELECT 
  'document-processor',
  'Document Processing Service',
  'Microservice for document upload, processing, and analysis',
  'https://api.example.com/documents',
  '1.0.0',
  'active',
  true,
  'https://api.example.com/documents/health',
  auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM microservices WHERE name = 'document-processor'
);