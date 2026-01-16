/*
  # Add is_free_preview field to course_lessons table

  1. Changes
    - Add `is_free_preview` boolean column to `course_lessons` table
    - Default value is false
    - This allows marking lessons as free previews that anyone can view without enrollment

  2. Notes
    - Existing lessons will have is_free_preview = false by default
    - Admins can change this value to true to make lessons available as free previews
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_lessons' AND column_name = 'is_free_preview'
  ) THEN
    ALTER TABLE course_lessons ADD COLUMN is_free_preview boolean DEFAULT false;
  END IF;
END $$;
