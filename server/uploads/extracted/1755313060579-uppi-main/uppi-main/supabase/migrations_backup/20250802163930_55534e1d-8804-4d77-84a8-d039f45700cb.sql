-- Fix RLS policies to ensure proper access control and eliminate permission errors

-- 1. First, let's create a security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$;

-- 2. Create function to check if user is admin safely
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- 3. Create function to check platform roles safely
CREATE OR REPLACE FUNCTION public.has_platform_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = $1 AND role = role_name
  );
$$;

-- 4. Fix api_keys policies (critical for edge functions)
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Fix competitor_analyses policies
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON public.competitor_analyses;
CREATE POLICY "Users can view their own competitor analyses"
  ON public.competitor_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitor analyses"
  ON public.competitor_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor analyses"
  ON public.competitor_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor analyses"
  ON public.competitor_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Fix chat_messages policies to avoid recursive queries
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own chat messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    WHERE cs.id = chat_messages.session_id AND cs.user_id = auth.uid()
  ));

-- 7. Ensure profiles table has proper policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- 8. Fix documentation policies using security definer functions
DROP POLICY IF EXISTS "Admins can manage all documentation" ON public.documentation;
CREATE POLICY "Admins can manage all documentation"
  ON public.documentation FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- 9. Fix affiliate_links policies using security definer functions
DROP POLICY IF EXISTS "Super admins can manage affiliate links" ON public.affiliate_links;
CREATE POLICY "Super admins can manage affiliate links"
  ON public.affiliate_links FOR ALL
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));

-- 10. Fix system_components policies
DROP POLICY IF EXISTS "Admins can manage system components" ON public.system_components;
DROP POLICY IF EXISTS "Super admins can manage system components" ON public.system_components;
CREATE POLICY "Admins can manage system components"
  ON public.system_components FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()) OR public.has_platform_role(auth.uid(), 'super_admin'));

-- 11. Fix website_analytics policies
DROP POLICY IF EXISTS "Super admins can manage analytics" ON public.website_analytics;
CREATE POLICY "Super admins can manage analytics"
  ON public.website_analytics FOR ALL
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));

-- 12. Fix platform_roles policies using is_admin_user function
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.platform_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.platform_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.platform_roles FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can view all roles"
  ON public.platform_roles FOR SELECT
  TO authenticated
  USING (public.is_user_admin(auth.uid()) OR auth.uid() = user_id);

-- 13. Fix organizations policies
DROP POLICY IF EXISTS "Admins can manage organizations" ON public.organizations;
CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.is_user_admin(auth.uid()));

-- 14. Ensure all user-specific tables have proper user_id constraints
-- Add NOT NULL constraints where missing (this prevents RLS violations)
ALTER TABLE public.api_keys ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.competitor_analyses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.chat_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.competitor_groups ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.platform_roles ALTER COLUMN user_id SET NOT NULL;