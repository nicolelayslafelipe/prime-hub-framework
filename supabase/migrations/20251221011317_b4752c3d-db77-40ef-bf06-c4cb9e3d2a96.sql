-- Remove duplicate roles, keeping only the priority role for each user
DELETE FROM user_roles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_roles 
  ORDER BY user_id, 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'kitchen' THEN 2 
      WHEN 'motoboy' THEN 3 
      ELSE 4 
    END
);

-- Add unique constraint to prevent future duplicates (user can have only ONE role)
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS unique_user_role;
ALTER TABLE user_roles ADD CONSTRAINT unique_user_role UNIQUE (user_id);