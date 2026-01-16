/*
  # Update Lesson Progress Table

  1. Changes
    - Add `course_id` column to `lesson_progress` table
    - Add `created_at` and `updated_at` columns
    - Add foreign key constraint for course_id
    - Add index for better query performance
  
  2. Notes
    - This allows tracking which course a lesson belongs to
    - Needed for sequential lesson unlocking logic
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE lesson_progress ADD COLUMN course_id uuid REFERENCES courses(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(course_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE lesson_progress ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE lesson_progress ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
