-- Enable TEAMS feature flag globally
SELECT set_feature_flag('TEAMS', 'global', NULL, true);

-- Verify teams table structure and add missing columns if needed
DO $$
BEGIN
    -- Add settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'settings') THEN
        ALTER TABLE public.teams ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    -- Ensure proper RLS policies exist for teams
    DROP POLICY IF EXISTS "Users can view teams they're members of" ON public.teams;
    CREATE POLICY "Users can view teams they're members of" 
    ON public.teams FOR SELECT 
    USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_id = teams.id 
            AND tm.user_id = auth.uid() 
            AND tm.status = 'active'
        )
    );
    
    DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
    CREATE POLICY "Team owners can update their teams" 
    ON public.teams FOR UPDATE 
    USING (auth.uid() = owner_id);
    
    DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
    CREATE POLICY "Authenticated users can create teams" 
    ON public.teams FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);
    
    DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
    CREATE POLICY "Team owners can delete their teams" 
    ON public.teams FOR DELETE 
    USING (auth.uid() = owner_id);
    
    -- Ensure team_members policies
    DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
    CREATE POLICY "Team members can view team membership" 
    ON public.team_members FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_members.team_id 
            AND t.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_id = team_members.team_id 
            AND tm.user_id = auth.uid() 
            AND tm.status = 'active'
        )
    );
    
    DROP POLICY IF EXISTS "Team owners and service can manage members" ON public.team_members;
    CREATE POLICY "Team owners and service can manage members" 
    ON public.team_members FOR ALL 
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_members.team_id 
            AND t.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_members.team_id 
            AND t.owner_id = auth.uid()
        )
    );
    
    -- Ensure team_invitations policies
    DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;
    CREATE POLICY "Team members can view invitations" 
    ON public.team_invitations FOR SELECT 
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_invitations.team_id 
            AND t.owner_id = auth.uid()
        )
    );
    
    DROP POLICY IF EXISTS "Team owners can manage invitations" ON public.team_invitations;
    CREATE POLICY "Team owners can manage invitations" 
    ON public.team_invitations FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_invitations.team_id 
            AND t.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = team_invitations.team_id 
            AND t.owner_id = auth.uid()
        )
    );
    
END $$;