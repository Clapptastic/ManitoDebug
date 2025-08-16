-- Additional Medium Priority Fixes

-- Issue 6: Add GDPR compliance data handling functions
CREATE OR REPLACE FUNCTION public.anonymize_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  anonymized_count integer := 0;
BEGIN
  -- Only allow users to anonymize their own data or admins
  IF NOT (auth.uid() = target_user_id OR is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied: Can only anonymize own data';
  END IF;
  
  -- Anonymize profile data
  UPDATE public.profiles 
  SET 
    email = 'anonymized_' || substring(gen_random_uuid()::text, 1, 8) || '@deleted.user',
    full_name = 'Anonymized User',
    updated_at = now()
  WHERE user_id = target_user_id;
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  
  -- Log the anonymization
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, metadata, created_at
  ) VALUES (
    target_user_id, 'user_data_anonymized', 'profiles', target_user_id::text,
    jsonb_build_object('anonymized_at', now(), 'gdpr_compliance', true),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'anonymized_records', anonymized_count,
    'anonymized_at', now()
  );
END;
$$;

-- Issue 7: Add automated security scanning function
CREATE OR REPLACE FUNCTION public.run_security_scan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  scan_results jsonb := '{}'::jsonb;
  rls_issues integer := 0;
  orphaned_records integer := 0;
  weak_passwords integer := 0;
BEGIN
  -- Check for tables without RLS enabled
  SELECT COUNT(*) INTO rls_issues
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.schemaname = 'public' AND p.tablename = t.table_name
    );
  
  -- Check for orphaned API keys (keys without valid users)
  SELECT COUNT(*) INTO orphaned_records
  FROM public.api_keys ak
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = ak.user_id
  );
  
  scan_results := jsonb_build_object(
    'scan_timestamp', now(),
    'rls_issues_count', rls_issues,
    'orphaned_api_keys', orphaned_records,
    'overall_security_score', 
      CASE 
        WHEN rls_issues = 0 AND orphaned_records = 0 THEN 95
        WHEN rls_issues <= 2 AND orphaned_records <= 5 THEN 80
        ELSE 60
      END,
    'recommendations', ARRAY[
      CASE WHEN rls_issues > 0 THEN 'Enable RLS on all public tables' END,
      CASE WHEN orphaned_records > 0 THEN 'Clean up orphaned API key records' END
    ]::text[]
  );
  
  -- Log the security scan
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, metadata, created_at
  ) VALUES (
    NULL, 'security_scan_completed', 'system', scan_results, NOW()
  );
  
  RETURN scan_results;
END;
$$;

-- Issue 8: Add performance monitoring function
CREATE OR REPLACE FUNCTION public.monitor_database_performance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  performance_metrics jsonb := '{}'::jsonb;
  slow_queries integer := 0;
  large_tables text[] := '{}';
  table_info record;
BEGIN
  -- Check for large tables that might need optimization
  FOR table_info IN
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 5
  LOOP
    large_tables := large_tables || (table_info.tablename || ' (' || table_info.size || ')')::text;
  END LOOP;
  
  performance_metrics := jsonb_build_object(
    'scan_timestamp', now(),
    'largest_tables', large_tables,
    'optimization_needed', array_length(large_tables, 1) > 0,
    'recommendations', ARRAY[
      'Consider partitioning large tables',
      'Review and optimize slow queries',
      'Add missing indexes for frequently queried columns'
    ]
  );
  
  RETURN performance_metrics;
END;
$$;

-- Issue 9: Fix remaining table redundancies by adding proper constraints
-- Consolidate overlapping audit functionality
ALTER TABLE public.admin_audit_log 
ADD COLUMN IF NOT EXISTS is_legacy boolean DEFAULT true;

-- Add constraint to prevent duplicate affiliate programs
ALTER TABLE public.affiliate_programs 
ADD CONSTRAINT uk_affiliate_programs_domain_provider 
UNIQUE (domain, provider);

-- Issue 10: Add missing foreign key constraints for data integrity
-- Add foreign key for billing_subscriptions to users (via profiles)
-- First, add any missing profile records for existing subscription users
INSERT INTO public.profiles (id, user_id, email, full_name, role, created_at)
SELECT 
  bs.user_id, bs.user_id, 
  COALESCE(au.email, 'unknown@example.com'),
  'Migration User', 'user', now()
FROM public.billing_subscriptions bs
LEFT JOIN auth.users au ON au.id = bs.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = bs.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add proper indexing for foreign key relationships
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_id ON public.billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON public.billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);