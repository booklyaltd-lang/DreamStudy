/*
  # Fix Admin Policy Infinite Recursion

  1. Changes
    - Drop the problematic "Admins can update any user profile" policy that causes infinite recursion
    - Create a helper function `is_admin()` with SECURITY DEFINER to check admin role without triggering RLS
    - Create new policy using the helper function to avoid recursion
  
  2. Security
    - The `is_admin()` function uses SECURITY DEFINER to bypass RLS when checking the role
    - This prevents the infinite recursion while maintaining secure admin checks
    - Policy ensures only authenticated admins can update any user's profile
*/

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins can update any user profile" ON profiles;

-- Create a function to check if current user is admin (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;

-- Create policy using the helper function
CREATE POLICY "Admins can update any user profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
