/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing index for blog_posts.author_id foreign key
    - Optimize all RLS policies to use (select auth.uid()) pattern
    - Fix is_admin() function to have stable search path

  2. Security
    - All policies maintain existing security rules
    - Improved performance at scale for RLS policy evaluation
*/

-- 1. Add missing index for blog_posts.author_id foreign key
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- 2. Fix is_admin function to have stable search path and be STABLE
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 3. Optimize profiles table RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own role" ON profiles;
CREATE POLICY "Users can view own role"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;
CREATE POLICY "Only admins can update roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. Optimize enrollments table RLS policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
CREATE POLICY "Users can create own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;
CREATE POLICY "Users can update own enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 5. Optimize lesson_progress table RLS policies
DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
CREATE POLICY "Users can view own lesson progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own lesson progress" ON lesson_progress;
CREATE POLICY "Users can create own lesson progress"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;
CREATE POLICY "Users can update own lesson progress"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 6. Optimize courses table RLS policies
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
CREATE POLICY "Admins can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can create courses" ON courses;
CREATE POLICY "Admins can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update courses" ON courses;
CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (is_admin());

-- 7. Optimize site_settings table RLS policies
DROP POLICY IF EXISTS "Only admins can update site settings" ON site_settings;
CREATE POLICY "Only admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 8. Optimize course_lessons table RLS policies
DROP POLICY IF EXISTS "Admins can view all lessons" ON course_lessons;
CREATE POLICY "Admins can view all lessons"
  ON course_lessons FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert lessons" ON course_lessons;
CREATE POLICY "Admins can insert lessons"
  ON course_lessons FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update lessons" ON course_lessons;
CREATE POLICY "Admins can update lessons"
  ON course_lessons FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete lessons" ON course_lessons;
CREATE POLICY "Admins can delete lessons"
  ON course_lessons FOR DELETE
  TO authenticated
  USING (is_admin());

-- 9. Optimize pricing_tiers table RLS policies
DROP POLICY IF EXISTS "Admins can insert tiers" ON pricing_tiers;
CREATE POLICY "Admins can insert tiers"
  ON pricing_tiers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update tiers" ON pricing_tiers;
CREATE POLICY "Admins can update tiers"
  ON pricing_tiers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete tiers" ON pricing_tiers;
CREATE POLICY "Admins can delete tiers"
  ON pricing_tiers FOR DELETE
  TO authenticated
  USING (is_admin());
