/*
  # Fix RLS Performance and Security Issues

  1. Performance Improvements
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
    
  2. Security Improvements
    - Fix function search_path to be immutable
    - Recreate update_updated_at_column function with proper search_path

  3. Affected Tables
    - user_subscriptions (4 policies)
    - course_purchases (4 policies)
*/

-- Drop existing policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON user_subscriptions;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can insert subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete subscriptions"
  ON user_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- Drop existing policies for course_purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON course_purchases;
DROP POLICY IF EXISTS "Admins can insert purchases" ON course_purchases;
DROP POLICY IF EXISTS "Admins can update purchases" ON course_purchases;
DROP POLICY IF EXISTS "Admins can delete purchases" ON course_purchases;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Users can view own purchases"
  ON course_purchases
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can insert purchases"
  ON course_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update purchases"
  ON course_purchases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can delete purchases"
  ON course_purchases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
  );

-- Fix function search_path issue
-- Recreate the function with a stable search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
