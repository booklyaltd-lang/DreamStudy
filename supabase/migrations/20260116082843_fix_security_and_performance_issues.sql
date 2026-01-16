/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add indexes on foreign key columns:
      - blog_posts.author_id
      - course_purchases.course_id
      - enrollments.course_id
      - lesson_progress.lesson_id
      - user_subscriptions.user_id
  
  2. RLS Policy Optimization
    - Update profiles RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation for each row and improves performance at scale
  
  3. Function Security
    - Set immutable search_path on get_user_tier and can_access_tier functions
    - This prevents search_path injection attacks
  
  4. Notes
    - Auth DB Connection Strategy: Configure in Supabase Dashboard (Auth > Settings)
    - Leaked Password Protection: Enable in Supabase Dashboard (Auth > Policies)
*/

-- ============================================================================
-- 1. ADD INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- Index for blog_posts.author_id
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id 
  ON blog_posts(author_id);

-- Index for course_purchases.course_id
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id 
  ON course_purchases(course_id);

-- Index for enrollments.course_id
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id 
  ON enrollments(course_id);

-- Index for lesson_progress.lesson_id
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id 
  ON lesson_progress(lesson_id);

-- Index for user_subscriptions.user_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
  ON user_subscriptions(user_id);

-- ============================================================================
-- 2. FIX RLS POLICIES ON PROFILES TABLE
-- ============================================================================

-- Drop and recreate "Users can update own profile" policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Drop and recreate "Prevent non-admins from changing roles" policy
DROP POLICY IF EXISTS "Prevent non-admins from changing roles" ON profiles;

CREATE POLICY "Prevent non-admins from changing roles"
  ON profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    role = (SELECT role FROM profiles WHERE id = (select auth.uid()))
    OR 
    (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
  )
  WITH CHECK (
    role = (SELECT role FROM profiles WHERE id = (select auth.uid()))
    OR 
    (SELECT role FROM profiles WHERE id = (select auth.uid())) = 'admin'
  );

-- ============================================================================
-- 3. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Recreate get_user_tier with stable search_path
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If no user is authenticated, return 'free'
  IF auth.uid() IS NULL THEN
    RETURN 'free';
  END IF;
  
  -- Check if user is admin
  IF is_admin() THEN
    RETURN 'premium';
  END IF;
  
  -- Get user's subscription tier from profiles
  RETURN (
    SELECT COALESCE(subscription_tier, 'free')
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Recreate can_access_tier with stable search_path
CREATE OR REPLACE FUNCTION can_access_tier(required_tier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
