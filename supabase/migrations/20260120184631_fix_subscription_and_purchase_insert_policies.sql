/*
  # Fix Subscription and Purchase INSERT Policies

  1. Changes
    - Add INSERT policy for user_subscriptions that allows service role and payment systems
    - Add INSERT policy for course_purchases that allows service role and payment systems
    - These policies are needed for Edge Functions to create subscriptions and purchases after payment

  2. Security
    - Service role can insert subscriptions and purchases (for payment processing)
    - Users cannot directly insert their own subscriptions/purchases
    - Only admins can manually insert through the UI
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can insert purchases" ON course_purchases;

-- Create new INSERT policy for user_subscriptions
-- Allows service role (used by Edge Functions) and admins to insert
CREATE POLICY "Service role and admins can insert subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    -- Always allow service_role (for Edge Functions)
    auth.jwt()->>'role' = 'service_role' OR
    -- Also allow admins through the UI
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create new INSERT policy for course_purchases
-- Allows service role (used by Edge Functions) and admins to insert
CREATE POLICY "Service role and admins can insert purchases"
  ON course_purchases
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    -- Always allow service_role (for Edge Functions)
    auth.jwt()->>'role' = 'service_role' OR
    -- Also allow admins through the UI
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );