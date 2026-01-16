/*
  # Fix "Prevent non-admins from changing roles" Policy Recursion

  1. Changes
    - Drop the "Prevent non-admins from changing roles" policy that causes infinite recursion
    - Recreate the policy using the `is_admin()` helper function
    - This prevents recursion by using SECURITY DEFINER function instead of direct queries
  
  2. Security
    - Maintains the same security logic: users can only change role if they are admin
    - Uses the `is_admin()` helper function to avoid infinite recursion
    - Policy is RESTRICTIVE, meaning it creates an AND condition with permissive policies
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Prevent non-admins from changing roles" ON profiles;

-- Recreate the policy using is_admin() function to avoid recursion
CREATE POLICY "Prevent non-admins from changing roles"
  ON profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid() LIMIT 1)
    OR is_admin()
  )
  WITH CHECK (
    role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid() LIMIT 1)
    OR is_admin()
  );
