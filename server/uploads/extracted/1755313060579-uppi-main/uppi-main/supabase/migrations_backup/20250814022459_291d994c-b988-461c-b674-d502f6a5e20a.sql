-- Enable TEAMS feature flag using direct insert (bypassing RPC that requires actor_id)
INSERT INTO public.feature_flags (id, flag_name, description, is_enabled, user_id, project_id, metadata, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'TEAMS',
    'Enable team collaboration features',
    true,
    NULL,
    NULL,
    '{"enabled_globally": true}'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (flag_name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid))
DO UPDATE SET
    is_enabled = true,
    updated_at = NOW(),
    metadata = '{"enabled_globally": true}'::jsonb;

-- Fix team_members RLS policy to allow proper insert during team creation
DROP POLICY IF EXISTS "Team owners and service can manage members" ON public.team_members;
CREATE POLICY "Team owners and service can manage members" 
ON public.team_members FOR ALL 
USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid() OR  -- Allow users to see their own memberships
    EXISTS (
        SELECT 1 FROM public.teams t 
        WHERE t.id = team_members.team_id 
        AND t.owner_id = auth.uid()
    )
)
WITH CHECK (
    auth.role() = 'service_role' OR
    user_id = auth.uid() OR  -- Allow users to insert their own memberships
    EXISTS (
        SELECT 1 FROM public.teams t 
        WHERE t.id = team_members.team_id 
        AND t.owner_id = auth.uid()
    )
);