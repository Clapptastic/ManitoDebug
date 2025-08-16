-- Simple approach: Enable TEAMS feature flag by direct update
UPDATE public.feature_flags 
SET is_enabled = true, updated_at = NOW()
WHERE flag_name = 'TEAMS' AND user_id IS NULL AND project_id IS NULL;

-- If no global flag exists, insert it
INSERT INTO public.feature_flags (flag_name, is_enabled, description, metadata)
SELECT 'TEAMS', true, 'Enable team collaboration features', '{"enabled_globally": true}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM public.feature_flags 
    WHERE flag_name = 'TEAMS' AND user_id IS NULL AND project_id IS NULL
);