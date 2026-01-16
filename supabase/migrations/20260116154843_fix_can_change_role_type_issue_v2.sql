/*
  # Fix Type Issue in can_change_role Function

  1. Changes
    - Drop policy first, then recreate function with explicit type casting
    - Recreate policy with explicit column reference
    - Ensure proper type handling for user_role enum
  
  2. Security
    - Maintains same logic: only admins can change roles
    - Uses explicit casting to avoid type confusion
*/

-- Drop the policy first (it depends on the function)
DROP POLICY IF EXISTS "Prevent non-admins from changing roles" ON profiles;

-- Drop and recreate the function with better type handling
DROP FUNCTION IF EXISTS can_change_role(user_role);

CREATE OR REPLACE FUNCTION can_change_role(new_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
  user_is_admin BOOLEAN;
BEGIN
  -- Get current user's role
  SELECT p.role INTO current_user_role
  FROM profiles p
  WHERE p.id = auth.uid();
  
  -- Check if user is admin
  user_is_admin := (current_user_role = 'admin'::user_role);
  
  -- Allow if admin OR if role is not changing
  RETURN user_is_admin OR (current_user_role = new_role);
END;
$$;

-- Recreate the policy with explicit table qualification
CREATE POLICY "Prevent non-admins from changing roles"
  ON profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (can_change_role(profiles.role));
