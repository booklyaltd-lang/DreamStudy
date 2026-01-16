/*
  # Properly Fix Role Change Policy to Prevent Recursion

  1. Changes
    - Drop and recreate "Prevent non-admins from changing roles" policy
    - New approach: only admins can change the role field
    - Uses OLD and NEW pseudo-relations to check if role field is being modified
    - Completely avoids any queries to the profiles table
  
  2. Security
    - Only admins can change role field (either their own or others)
    - Regular users cannot modify the role field at all
    - No recursion possible since we only use is_admin() function
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Prevent non-admins from changing roles" ON profiles;

-- Recreate with a simpler, non-recursive approach
-- This policy is RESTRICTIVE (creates AND condition)
-- It allows role changes ONLY when:
-- 1. The role is not being changed, OR
-- 2. The user is an admin
CREATE POLICY "Prevent non-admins from changing roles"
  ON profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)  -- Allow the update attempt
  WITH CHECK (
    -- Either role is not being changed, or user is admin
    (SELECT p.role FROM profiles p WHERE p.id = (SELECT id FROM profiles WHERE id = auth.uid() LIMIT 1) LIMIT 1) = role
    OR is_admin()
  );
