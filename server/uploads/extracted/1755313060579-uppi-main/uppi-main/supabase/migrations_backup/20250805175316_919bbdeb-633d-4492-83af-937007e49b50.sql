-- Grant super admin role to the current user for testing
-- This inserts a super admin role if it doesn't exist

INSERT INTO user_roles (user_id, role, is_active)
SELECT '5a922aca-e1a4-4a1f-a32b-aaec11b645f3', 'super_admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' 
  AND role = 'super_admin'
  AND is_active = true
);

-- Also add an admin role as fallback
INSERT INTO user_roles (user_id, role, is_active)
SELECT '5a922aca-e1a4-4a1f-a32b-aaec11b645f3', 'admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' 
  AND role = 'admin'
  AND is_active = true
);

-- Ensure there's a profile entry
INSERT INTO profiles (user_id, role)
SELECT '5a922aca-e1a4-4a1f-a32b-aaec11b645f3', 'super_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'
);