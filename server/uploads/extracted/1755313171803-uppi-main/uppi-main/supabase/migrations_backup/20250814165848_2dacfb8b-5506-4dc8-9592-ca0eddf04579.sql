-- Remove hardcoded super admin UUID and create secure role-based system
-- Step 1: Create admin_users table if it doesn't exist and populate with current user
DO $$
BEGIN
  -- Create admin_users table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    CREATE TABLE public.admin_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      email text NOT NULL,
      role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
      is_active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      UNIQUE(user_id, role)
    );
    
    -- Enable RLS
    ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Admins can view all admin users" ON public.admin_users
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users au 
          WHERE au.user_id = auth.uid() 
          AND au.role IN ('admin', 'super_admin') 
          AND au.is_active = true
        )
      );
    
    CREATE POLICY "Super admins can manage admin users" ON public.admin_users
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users au 
          WHERE au.user_id = auth.uid() 
          AND au.role = 'super_admin' 
          AND au.is_active = true
        )
      );
  END IF;
  
  -- Insert current super admin user (replace hardcoded UUID with email-based lookup)
  INSERT INTO public.admin_users (user_id, email, role, is_active)
  SELECT 
    au.id, 
    au.email, 
    'super_admin',
    true
  FROM auth.users au 
  WHERE au.email = 'akclapp@gmail.com'
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = now();
END $$;

-- Step 2: Create secure role checking function
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  effective_user uuid;
BEGIN
  effective_user := COALESCE(check_user_id, auth.uid());
  
  IF effective_user IS NULL THEN
    RETURN 'anonymous';
  END IF;
  
  -- Check admin_users table first
  SELECT role INTO user_role
  FROM public.admin_users 
  WHERE user_id = effective_user 
    AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'super_admin' THEN 1 
      WHEN 'admin' THEN 2 
      ELSE 3 
    END
  LIMIT 1;
  
  -- Fallback to profiles table if exists
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM public.profiles 
    WHERE user_id = effective_user 
      AND is_active = true
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Step 3: Update competitor analysis progress functions to use role-based access
CREATE OR REPLACE FUNCTION public.insert_competitor_analysis_progress(session_id_param text, user_id_param uuid, total_competitors_param integer, metadata_param jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
  current_user_role text;
BEGIN
  current_user_role := public.get_user_role(auth.uid());
  
  -- Allow access for: same user, admins, super_admins, or service role
  IF NOT (
    auth.uid() = user_id_param OR 
    current_user_role IN ('admin', 'super_admin') OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  INSERT INTO competitor_analysis_progress (
    session_id,
    user_id,
    status,
    total_competitors,
    completed_competitors,
    progress_percentage,
    metadata
  ) VALUES (
    session_id_param,
    user_id_param,
    'pending',
    total_competitors_param,
    0,
    0,
    metadata_param
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_competitor_analysis_progress(session_id_param text, status_param text DEFAULT NULL::text, progress_percentage_param numeric DEFAULT NULL::numeric, completed_competitors_param integer DEFAULT NULL::integer, current_competitor_param text DEFAULT NULL::text, error_message_param text DEFAULT NULL::text, metadata_param jsonb DEFAULT NULL::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role text;
  progress_user_id uuid;
BEGIN
  current_user_role := public.get_user_role(auth.uid());
  
  -- Get the user_id for this session
  SELECT user_id INTO progress_user_id
  FROM competitor_analysis_progress 
  WHERE session_id = session_id_param
  LIMIT 1;
  
  -- Allow access for: same user, admins, super_admins, or service role
  IF NOT (
    auth.uid() = progress_user_id OR 
    current_user_role IN ('admin', 'super_admin') OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied or session not found';
  END IF;
  
  UPDATE competitor_analysis_progress
  SET 
    status = COALESCE(status_param, status),
    progress_percentage = COALESCE(progress_percentage_param, progress_percentage),
    completed_competitors = COALESCE(completed_competitors_param, completed_competitors),
    current_competitor = COALESCE(current_competitor_param, current_competitor),
    error_message = COALESCE(error_message_param, error_message),
    metadata = COALESCE(metadata_param, metadata),
    updated_at = now()
  WHERE session_id = session_id_param;
  
  RETURN FOUND;
END;
$$;

-- Step 4: Create structured logging for admin operations
CREATE TABLE IF NOT EXISTS public.admin_operation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  session_id text
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_operation_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin operation logs
CREATE POLICY "Admins can view admin operation logs" ON public.admin_operation_logs
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_user_id ON public.admin_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_created_at ON public.admin_operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_operation_type ON public.admin_operation_logs(operation_type);

-- Step 5: Create rate limiting tracking table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  window_end timestamp with time zone DEFAULT (now() + interval '1 hour'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Enable RLS on rate limiting
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limiting
CREATE POLICY "Users can view their own rate limits" ON public.rate_limit_tracking
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits" ON public.rate_limit_tracking
  FOR ALL TO authenticated
  USING (
    auth.role() = 'service_role' OR 
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Create function to log admin operations
CREATE OR REPLACE FUNCTION public.log_admin_operation(
  operation_type_param text,
  resource_type_param text DEFAULT NULL,
  resource_id_param text DEFAULT NULL,
  details_param jsonb DEFAULT '{}',
  session_id_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.admin_operation_logs (
    user_id,
    operation_type,
    resource_type,
    resource_id,
    details,
    session_id
  ) VALUES (
    auth.uid(),
    operation_type_param,
    resource_type_param,
    resource_id_param,
    details_param,
    session_id_param
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;