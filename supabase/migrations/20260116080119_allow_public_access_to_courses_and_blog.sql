/*
  # Allow public access to published courses and blog posts

  1. Changes
    - Update RLS policy for courses table to allow anonymous users to view published courses
    - Update RLS policy for blog_posts table to allow anonymous users to view published blog posts
  
  2. Security
    - Anonymous users can only SELECT (read) published content
    - All other operations (INSERT, UPDATE, DELETE) remain restricted to authenticated admins
    - Unpublished content remains visible only to admins
*/

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "View published courses or all if admin" ON courses;
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

-- Create new SELECT policies that allow both anonymous and authenticated users
CREATE POLICY "View published courses or all if admin"
  ON courses
  FOR SELECT
  TO anon, authenticated
  USING ((is_published = true) OR is_admin());

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
