/*
  # Add About Features List to Site Settings
  
  1. Changes
    - Add `about_features` field to store the list of features/benefits shown in the about section
  
  2. Notes
    - Field stores JSONB array of strings
    - Default value includes the current hardcoded list
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'about_features'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN about_features jsonb DEFAULT '["Обучение в удобном темпе", "Сертификаты о прохождении", "Поддержка экспертов", "Практические проекты"]'::jsonb;
  END IF;
END $$;
