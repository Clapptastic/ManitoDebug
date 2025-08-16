-- Create shared workspaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.shared_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workspace_type TEXT DEFAULT 'general',
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE public.shared_workspaces ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shared_workspaces' 
    AND policyname = 'Team members can access shared workspaces'
  ) THEN
    CREATE POLICY "Team members can access shared workspaces" 
    ON public.shared_workspaces 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = shared_workspaces.team_id AND user_id = auth.uid() AND status = 'active'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shared_workspaces' 
    AND policyname = 'Team owners can manage shared workspaces'
  ) THEN
    CREATE POLICY "Team owners can manage shared workspaces" 
    ON public.shared_workspaces 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = shared_workspaces.team_id AND owner_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Add update trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_shared_workspaces_updated_at'
  ) THEN
    CREATE TRIGGER update_shared_workspaces_updated_at
      BEFORE UPDATE ON public.shared_workspaces
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;