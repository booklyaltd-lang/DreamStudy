/*
  # Add Admin Policies for Courses Management

  1. Changes
    - Add INSERT policy for admins to create courses
    - Add UPDATE policy for admins to modify courses
    - Add DELETE policy for admins to remove courses
    - Add SELECT policy for admins to view all courses (including unpublished)

  2. Security
    - Only users with role='admin' in profiles table can manage courses
    - Admins can view, create, update, and delete any course
*/

-- Allow admins to view all courses (including unpublished)
CREATE POLICY "Admins can view all courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to create courses
CREATE POLICY "Admins can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update courses
CREATE POLICY "Admins can update courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete courses
CREATE POLICY "Admins can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
