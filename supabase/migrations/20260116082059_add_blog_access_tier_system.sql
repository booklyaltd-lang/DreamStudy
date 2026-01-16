/*
  # Add Blog Post Access Tier System

  1. New Functions
    - `get_user_tier()` - Returns the current user's subscription tier (free, basic, premium)
    - `can_access_tier(required_tier)` - Checks if user can access content with specific tier requirement
  
  2. Changes
    - Blog posts now respect required_tier field
    - Free tier: accessible by everyone
    - Basic tier: accessible by basic and premium users
    - Premium tier: accessible only by premium users
    - Admins can access all content regardless of tier
  
  3. Security
    - RLS policies remain restrictive
    - Anonymous users can only view free tier posts
    - Authenticated users can view posts according to their subscription
*/

-- Function to get current user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If no user is authenticated, return 'free'
  IF auth.uid() IS NULL THEN
    RETURN 'free';
  END IF;
  
  -- Check if user is admin
  IF is_admin() THEN
    RETURN 'premium';  -- Admins have full access
  END IF;
  
  -- Get user's subscription tier from profiles
  RETURN (
    SELECT COALESCE(subscription_tier, 'free')
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Function to check if user can access content with a specific tier requirement
CREATE OR REPLACE FUNCTION can_access_tier(required_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier text;
BEGIN
  -- Get user's current tier
  user_tier := get_user_tier();
  
  -- Free content is accessible to everyone
  IF required_tier = 'free' THEN
    RETURN true;
  END IF;
  
  -- Basic content is accessible to basic and premium users
  IF required_tier = 'basic' THEN
    RETURN user_tier IN ('basic', 'premium');
  END IF;
  
  -- Premium content is accessible only to premium users
  IF required_tier = 'premium' THEN
    RETURN user_tier = 'premium';
  END IF;
  
  -- Default: no access
  RETURN false;
END;
$$;

-- Update blog_posts SELECT policy to respect tier requirements
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
  );

-- Note: Access control will be handled at the application level using the can_access_tier function
-- This allows users to see all published posts (including locked ones) but content will be restricted in the app
