-- PHASE 2.1: RLS Policy Security Improvements
-- Create security definer functions to prevent recursive policy issues

-- Function to check if user is admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_email TEXT;
    user_role_result TEXT;
BEGIN
    -- Get user email from auth.users (accessible via security definer)
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = user_id_param;
    
    -- Check if super admin (hardcoded list for security)
    IF public.is_super_admin(user_email) THEN
        RETURN true;
    END IF;
    
    -- Check user roles table (with security definer to avoid RLS recursion)
    SELECT role INTO user_role_result 
    FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN user_role_result IN ('admin', 'super_admin');
END;
$$;

-- Enhanced API key management with better security
CREATE OR REPLACE FUNCTION public.can_access_api_key(key_user_id uuid, requesting_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Users can access their own keys
    IF key_user_id = requesting_user_id THEN
        RETURN true;
    END IF;
    
    -- Admins can access all keys
    IF public.is_admin_user(requesting_user_id) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- Audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    user_id_param uuid,
    event_type text,
    resource_type text,
    resource_id text DEFAULT NULL,
    metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata,
        created_at
    ) VALUES (
        user_id_param,
        event_type,
        resource_type,
        resource_id,
        metadata_param,
        NOW()
    );
END;
$$;

-- Enhanced RLS policies with better security patterns

-- Update api_keys policies to use security definer functions
DROP POLICY IF EXISTS "Enable full access for users on their own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Enable service role access for api_keys" ON public.api_keys;

CREATE POLICY "Users can manage their own API keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (public.can_access_api_key(user_id, auth.uid()))
WITH CHECK (public.can_access_api_key(user_id, auth.uid()));

CREATE POLICY "Service role full access to API keys"
ON public.api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update code_embeddings policies for better security
DROP POLICY IF EXISTS "Users can manage their own code embeddings" ON public.code_embeddings;
DROP POLICY IF EXISTS "Super admin can manage all code embeddings" ON public.code_embeddings;

CREATE POLICY "Users can manage their own code embeddings"
ON public.code_embeddings
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    public.is_admin_user(auth.uid())
)
WITH CHECK (
    user_id = auth.uid() OR 
    public.is_admin_user(auth.uid())
);

CREATE POLICY "Service role full access to code embeddings"
ON public.code_embeddings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enhanced competitor_analyses policies
CREATE POLICY "Enhanced user access to competitor analyses"
ON public.competitor_analyses
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    public.is_admin_user(auth.uid()) OR
    (organization_id IS NOT NULL AND 
     public.check_organization_permission(auth.uid(), organization_id, 'member'))
)
WITH CHECK (
    user_id = auth.uid() OR 
    public.is_admin_user(auth.uid()) OR
    (organization_id IS NOT NULL AND 
     public.check_organization_permission(auth.uid(), organization_id, 'admin'))
);

-- Enhanced chat_sessions and chat_messages policies for better isolation
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_service_access" ON public.chat_sessions;
DROP POLICY IF EXISTS "chat_sessions_user_access" ON public.chat_sessions;

CREATE POLICY "Enhanced chat sessions access"
ON public.chat_sessions
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    public.is_admin_user(auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
);

-- Trigger to log security events
CREATE OR REPLACE FUNCTION public.log_api_key_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Log API key access events
    IF TG_OP = 'SELECT' THEN
        PERFORM public.log_security_event(
            auth.uid(),
            'api_key_accessed',
            'api_keys',
            OLD.id::text,
            jsonb_build_object(
                'provider', OLD.provider,
                'operation', TG_OP
            )
        );
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM public.log_security_event(
            NEW.user_id,
            'api_key_created',
            'api_keys',
            NEW.id::text,
            jsonb_build_object(
                'provider', NEW.provider,
                'operation', TG_OP
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_security_event(
            NEW.user_id,
            'api_key_updated',
            'api_keys',
            NEW.id::text,
            jsonb_build_object(
                'provider', NEW.provider,
                'operation', TG_OP
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_security_event(
            OLD.user_id,
            'api_key_deleted',
            'api_keys',
            OLD.id::text,
            jsonb_build_object(
                'provider', OLD.provider,
                'operation', TG_OP
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the trigger (commented out for now to avoid performance impact)
-- DROP TRIGGER IF EXISTS api_key_security_log ON public.api_keys;
-- CREATE TRIGGER api_key_security_log
--     AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
--     FOR EACH ROW EXECUTE FUNCTION public.log_api_key_access();