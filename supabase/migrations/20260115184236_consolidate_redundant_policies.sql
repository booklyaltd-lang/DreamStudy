/*
  # Consolidate Redundant RLS Policies

  1. Changes
    - Consolidate redundant SELECT policies on profiles table
    - Keep the more permissive "Users can view own role" policy which covers both use cases
    - Maintain all existing security rules

  2. Security
    - No security changes, just consolidation of overlapping policies
    - Users can still view their own profiles and roles
    - Admins can still view all profiles
*/

-- Consolidate profiles SELECT policies
-- Remove the less permissive "Users can view own profile" policy
-- Keep "Users can view own role" which is more permissive and covers both cases
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Note: "Users can view own role" policy already exists and covers the use case
-- It allows: id = (select auth.uid()) OR is_admin()
-- This covers both viewing own profile and admin viewing all profiles
