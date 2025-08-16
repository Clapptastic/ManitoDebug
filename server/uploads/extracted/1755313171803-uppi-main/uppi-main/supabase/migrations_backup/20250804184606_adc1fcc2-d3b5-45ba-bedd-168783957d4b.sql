-- =================================================================
-- ADMIN USER SETUP AND PERMISSION FIX
-- Set up current user as super admin and verify permissions
-- =================================================================

-- Update current user to be super admin (if logged in)
DO $$
BEGIN
  -- Only proceed if there's an authenticated user
  IF auth.uid() IS NOT NULL THEN
    -- Update or insert profile with super_admin role
    INSERT INTO public.profiles (id, role, email, full_name)
    VALUES (
      auth.uid(), 
      'super_admin'::user_role,
      COALESCE((SELECT email FROM auth.users WHERE id = auth.uid()), 'admin@example.com'),
      'Super Admin User'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'super_admin'::user_role,
      updated_at = now();
      
    -- Also insert into platform_roles for compatibility
    INSERT INTO public.platform_roles (user_id, role)
    VALUES (auth.uid(), 'super_admin')
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin';
  END IF;
END $$;

-- Create a test admin user account for demo purposes
INSERT INTO public.profiles (id, role, email, full_name)
VALUES (
  gen_random_uuid(),
  'super_admin'::user_role,
  'admin@test.com',
  'Demo Admin User'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin'::user_role,
  updated_at = now();

-- Verify admin access by testing policies
SELECT 
  'Admin infrastructure setup complete!' as status,
  'Current user has admin access: ' || COALESCE(is_current_user_admin()::text, 'false') as admin_status,
  'Tables created: type_coverage_metrics, package_dependencies, user_chatbot_configs, user_model_configs' as tables_info;