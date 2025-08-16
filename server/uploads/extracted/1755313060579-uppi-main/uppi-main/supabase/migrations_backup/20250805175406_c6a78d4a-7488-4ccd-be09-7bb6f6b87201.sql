-- Add the user role since the query showed empty results
INSERT INTO user_roles (user_id, role, is_active) 
VALUES ('5a922aca-e1a4-4a1f-a32b-aaec11b645f3', 'super_admin', true)
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'super_admin',
  is_active = true;