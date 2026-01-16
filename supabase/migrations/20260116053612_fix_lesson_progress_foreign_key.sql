/*
  # Fix Lesson Progress Foreign Key

  1. Problem
    - `lesson_progress` table has foreign key pointing to `lessons` table
    - Application uses `course_lessons` table instead
    - This causes foreign key constraint violations when marking lessons as complete

  2. Solution
    - Drop old foreign key constraint pointing to `lessons` table
    - Create new foreign key constraint pointing to `course_lessons` table
    - This allows lesson progress to be tracked correctly

  3. Notes
    - The constraint name is taken from the database schema
    - Using CASCADE delete ensures if a lesson is deleted, its progress is also deleted
*/

-- Drop the old foreign key constraint pointing to lessons table
ALTER TABLE lesson_progress 
DROP CONSTRAINT IF EXISTS lesson_progress_lesson_id_fkey;

-- Create new foreign key constraint pointing to course_lessons table
ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_lesson_id_fkey 
FOREIGN KEY (lesson_id) 
REFERENCES course_lessons(id) 
ON DELETE CASCADE;