/*
  # Fix Multiple Permissive RLS Policies
  
  1. Security Issue: Multiple Permissive Policies
    - Combines duplicate permissive SELECT policies for courses and course_lessons
    - Fixes profiles UPDATE policies to prevent privilege escalation
    
  2. Changes Made:
    - **courses table**: Merge "Admins can view all courses" and "Anyone can view published courses" into single policy
    - **course_lessons table**: Merge "Admins can view all lessons" and "Everyone can view published lessons" into single policy
    - **profiles table**: Use restrictive policy to prevent users from modifying their role field
    
  3. Security Improvements:
    - Clearer access control logic with single policies
    - Prevents potential security issues from overlapping permissive policies
    - Adds explicit role protection in profiles table
*/

-- ============================================================================
-- 1. Fix courses table SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;

CREATE POLICY "View published courses or all if admin"
  ON courses FOR SELECT
  TO authenticated
  USING (is_published = true OR is_admin());

-- ============================================================================
-- 2. Fix course_lessons table SELECT policies  
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all lessons" ON course_lessons;
DROP POLICY IF EXISTS "Everyone can view published lessons" ON course_lessons;

CREATE POLICY "View published lessons or all if admin"
  ON course_lessons FOR SELECT
  TO authenticated, anon
  USING (is_published = true OR is_admin());

-- ============================================================================
-- 3. Fix profiles table UPDATE policies
-- ============================================================================

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;

-- Allow users to update their own profile OR admins to update any profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- Use RESTRICTIVE policy to prevent non-admins from changing role field
-- This creates an AND condition with the permissive policy above
CREATE POLICY "Prevent non-admins from changing roles"
  ON profiles 
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN is_admin() THEN true
      ELSE role = (SELECT role FROM profiles WHERE id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN is_admin() THEN true
      ELSE role = (SELECT role FROM profiles WHERE id = auth.uid())
    END
  );
