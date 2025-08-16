-- Fix edge_function_metrics table permissions
DROP POLICY IF EXISTS "Service role can insert function metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "Service role can manage all edge function metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "Service role can manage all function metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "Super admin can manage all function metrics" ON public.edge_function_metrics;

-- Enable RLS on edge_function_metrics table
ALTER TABLE public.edge_function_metrics ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for edge_function_metrics
CREATE POLICY "Service role can manage all function metrics" 
ON public.edge_function_metrics 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Super admin can view function metrics" 
ON public.edge_function_metrics 
FOR SELECT 
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']))
);

-- Fix documentation table permissions
DROP POLICY IF EXISTS "Service role can access documentation" ON public.documentation;
DROP POLICY IF EXISTS "Super admin and users can manage documentation" ON public.documentation;
DROP POLICY IF EXISTS "Super admins have full access to documentation" ON public.documentation;
DROP POLICY IF EXISTS "Users can delete their own documentation" ON public.documentation;
DROP POLICY IF EXISTS "Users can insert their own documentation" ON public.documentation;
DROP POLICY IF EXISTS "Users can update their own documentation" ON public.documentation;
DROP POLICY IF EXISTS "Users can view their own documentation" ON public.documentation;

-- Enable RLS on documentation table
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for documentation
CREATE POLICY "Users can view their own documentation" 
ON public.documentation 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documentation" 
ON public.documentation 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documentation" 
ON public.documentation 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documentation" 
ON public.documentation 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role access for all operations
CREATE POLICY "Service role full access to documentation" 
ON public.documentation 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');