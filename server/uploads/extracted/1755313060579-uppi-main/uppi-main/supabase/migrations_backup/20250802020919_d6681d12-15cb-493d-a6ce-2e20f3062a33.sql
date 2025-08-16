-- Add unique constraint to platform_roles and create admin user
ALTER TABLE public.platform_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id);

-- Now insert the admin user
INSERT INTO public.platform_roles (user_id, role)
VALUES ('b4df2927-56f4-45d1-9749-6cd60f56a808', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'super_admin',
  updated_at = now();

-- Create the profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'b4df2927-56f4-45d1-9749-6cd60f56a808', 
  'akclapp@gmail.com', 
  'Andrew Clapp', 
  'super_admin'
);

-- Add some test data to verify API functionality
INSERT INTO public.website_analytics (date, website_name, domain, pageviews, unique_visitors, bounce_rate, avg_session_duration)
VALUES 
  (CURRENT_DATE - INTERVAL '1 day', 'Manito.ai', 'manito.ai', 1250, 980, 0.32, 145),
  (CURRENT_DATE - INTERVAL '2 days', 'Manito.ai', 'manito.ai', 1180, 920, 0.28, 152),
  (CURRENT_DATE - INTERVAL '3 days', 'Manito.ai', 'manito.ai', 1320, 1050, 0.35, 138);