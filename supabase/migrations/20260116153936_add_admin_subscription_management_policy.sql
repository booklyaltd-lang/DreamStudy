/*
  # Add Admin Subscription Management Policy

  1. New Policy
    - Add policy to allow admins to update subscription tier and expiry for any user
    - This enables manual subscription management in the admin panel
  
  2. Security
    - Policy checks that the current user is an admin
    - Uses subquery to prevent re-evaluation for each row
*/

-- Allow admins to update any user's profile (including subscription fields)
CREATE POLICY "Admins can update any user profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
  );
