-- Update existing profile to super_admin role
UPDATE public.profiles 
SET role = 'super_admin', updated_at = now()
WHERE id = 'b4df2927-56f4-45d1-9749-6cd60f56a808';

-- Add constraint if it doesn't exist and insert/update platform_roles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_role' 
        AND table_name = 'platform_roles'
    ) THEN
        ALTER TABLE public.platform_roles 
        ADD CONSTRAINT unique_user_role UNIQUE (user_id);
    END IF;
END $$;

-- Insert or update platform role
INSERT INTO public.platform_roles (user_id, role)
VALUES ('b4df2927-56f4-45d1-9749-6cd60f56a808', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'super_admin',
  updated_at = now();

-- Add test analytics data
INSERT INTO public.website_analytics (date, website_name, domain, pageviews, unique_visitors, bounce_rate, avg_session_duration)
VALUES 
  (CURRENT_DATE - INTERVAL '1 day', 'Manito.ai', 'manito.ai', 1250, 980, 0.32, 145),
  (CURRENT_DATE - INTERVAL '2 days', 'Manito.ai', 'manito.ai', 1180, 920, 0.28, 152),
  (CURRENT_DATE - INTERVAL '3 days', 'Manito.ai', 'manito.ai', 1320, 1050, 0.35, 138)
ON CONFLICT DO NOTHING;