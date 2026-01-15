/*
  # Add Hero Badge and CTA Card Text Fields
  
  1. Changes
    - Add `hero_badge_text` field for the badge text above hero title
    - Add `cta_card_title` field for the call-to-action card title
    - Add `cta_card_subtitle` field for the call-to-action card subtitle
  
  2. Notes
    - Fields are nullable to maintain backward compatibility
    - Default values will be handled in the application layer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'hero_badge_text'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN hero_badge_text text DEFAULT 'Преобразите свою карьеру с курсами от экспертов';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'cta_card_title'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN cta_card_title text DEFAULT 'Начните сегодня';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'cta_card_subtitle'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN cta_card_subtitle text DEFAULT 'И измените свое будущее';
  END IF;
END $$;
