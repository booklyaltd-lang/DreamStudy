/*
  # Fix Role Change Policy with Helper Function

  1. New Functions
    - `can_change_role(new_role)` - checks if user can change to new_role
    - Uses SECURITY DEFINER to avoid recursion when checking current role
  
  2. Changes
    - Drop and recreate "Prevent non-admins from changing roles" policy
    - Use new helper function to avoid any recursion
  
  3. Security
    - Only admins can change role to a different value
    - Regular users can only keep their current role unchanged
*/

-- Create helper function to check if user can change to a specific role
CREATE OR REPLACE FUNCTION can_change_role(new_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role user_role;
  user_is_admin BOOLEAN;
BEGIN
  -- Get current user's role
  SELECT role INTO current_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user is admin
  user_is_admin := (current_role = 'admin');
  
  -- Allow if admin OR if role is not changing
  RETURN user_is_admin OR (current_role = new_role);
END;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Prevent non-admins from changing roles" ON profiles;

-- Recreate with helper function
CREATE POLICY "Prevent non-admins from changing roles"
  ON profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (can_change_role(role));
