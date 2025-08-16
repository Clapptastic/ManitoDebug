-- Fix missing columns and RLS policies for admin functionality

-- Add missing actual_cost column to competitor_analyses
ALTER TABLE competitor_analyses 
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2) DEFAULT 0.0;

-- Update RLS policies to allow admin access to key tables
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
FOR ALL USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

DROP POLICY IF EXISTS "Admin can view api metrics" ON api_metrics;
CREATE POLICY "Admin can view api metrics" ON api_metrics
FOR ALL USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

DROP POLICY IF EXISTS "Admin can view api costs" ON api_usage_costs;
CREATE POLICY "Admin can view api costs" ON api_usage_costs
FOR ALL USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

-- Ensure documentation table has proper admin access
DROP POLICY IF EXISTS "Admin can manage documentation" ON documentation;
CREATE POLICY "Admin can manage documentation" ON documentation
FOR ALL USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

-- Allow admins to view feature flags
DROP POLICY IF EXISTS "Admin can view feature flags" ON feature_flags;
CREATE POLICY "Admin can view feature flags" ON feature_flags
FOR ALL USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

-- Fix user_roles table access for admin functions
DROP POLICY IF EXISTS "Admin can manage user roles" ON user_roles;
CREATE POLICY "Admin can manage user roles" ON user_roles
FOR ALL USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);