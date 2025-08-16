-- Enable Row Level Security on api_keys table
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own API keys
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

-- Allow service role full access for edge functions
CREATE POLICY "Service role full access on API keys" 
ON public.api_keys 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create a function to safely handle API key management with proper user context
CREATE OR REPLACE FUNCTION public.manage_api_key(
  p_provider text,
  p_api_key text,
  p_key_hash text,
  p_masked_key text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  existing_record uuid;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Check if key already exists for this user and provider
  SELECT id INTO existing_record 
  FROM public.api_keys 
  WHERE user_id = auth.uid() AND provider = p_provider;

  IF existing_record IS NOT NULL THEN
    -- Update existing key
    UPDATE public.api_keys 
    SET 
      api_key = p_api_key,
      key_hash = p_key_hash,
      masked_key = p_masked_key,
      status = 'active',
      updated_at = now(),
      last_validated = now()
    WHERE id = existing_record;
    
    result := json_build_object(
      'success', true, 
      'action', 'updated',
      'id', existing_record,
      'provider', p_provider
    );
  ELSE
    -- Insert new key
    INSERT INTO public.api_keys (
      user_id,
      provider,
      api_key,
      key_hash,
      masked_key,
      name,
      key_prefix,
      status,
      is_active,
      permissions
    ) VALUES (
      auth.uid(),
      p_provider,
      p_api_key,
      p_key_hash,
      p_masked_key,
      p_provider || ' API Key',
      substring(p_masked_key from 1 for 4),
      'active',
      true,
      '["read", "write"]'::jsonb
    ) RETURNING id INTO existing_record;
    
    result := json_build_object(
      'success', true, 
      'action', 'created',
      'id', existing_record,
      'provider', p_provider
    );
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;