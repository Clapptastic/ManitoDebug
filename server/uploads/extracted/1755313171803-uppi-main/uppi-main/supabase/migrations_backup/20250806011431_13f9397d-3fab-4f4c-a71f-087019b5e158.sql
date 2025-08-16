-- Drop existing RLS policies for api_keys table
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role full access" ON public.api_keys;

-- Make user_id NOT NULL to ensure all API keys have an owner
ALTER TABLE public.api_keys ALTER COLUMN user_id SET NOT NULL;

-- Create new RLS policies with proper auth.uid() usage
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.api_keys 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role full access for edge functions
CREATE POLICY "Service role full access" 
ON public.api_keys 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Super admin access
CREATE POLICY "Super admin can manage all API keys" 
ON public.api_keys 
FOR ALL 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);