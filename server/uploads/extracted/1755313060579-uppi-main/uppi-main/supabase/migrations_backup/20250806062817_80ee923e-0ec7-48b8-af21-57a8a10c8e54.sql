-- Fix RLS policies for super admin access

-- Create super admin policy for api_keys table
CREATE POLICY "Super admins have full access to api_keys" 
ON public.api_keys 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin' OR
  user_id = auth.uid()
);

-- Create super admin policy for competitor_analyses table
CREATE POLICY "Super admins have full access to competitor_analyses" 
ON public.competitor_analyses 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin' OR
  user_id = auth.uid()
);

-- Create super admin policy for documents table
CREATE POLICY "Super admins have full access to documents" 
ON public.documents 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin' OR
  user_id = auth.uid()
);

-- Create super admin policy for profiles table
CREATE POLICY "Super admins have full access to profiles" 
ON public.profiles 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin' OR
  user_id = auth.uid()
);

-- Create super admin policy for company_profiles table
CREATE POLICY "Super admins have full access to company_profiles" 
ON public.company_profiles 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin' OR
  user_id = auth.uid()
);

-- Create super admin policy for edge_function_metrics table
CREATE POLICY "Super admins have full access to edge_function_metrics" 
ON public.edge_function_metrics 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin'
);

-- Create documentation table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.documentation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on documentation table
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

-- Create policy for documentation table
CREATE POLICY "Super admins have full access to documentation" 
ON public.documentation 
FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = 'super_admin'
);

-- Add trigger for updated_at on documentation
CREATE TRIGGER update_documentation_updated_at
BEFORE UPDATE ON public.documentation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();