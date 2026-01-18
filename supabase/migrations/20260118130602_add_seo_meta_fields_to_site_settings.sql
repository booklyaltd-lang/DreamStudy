/*
  # Add SEO and Open Graph meta fields to site_settings

  1. New Fields
    - `site_tagline` (text) - Tagline for the site (e.g., "Знания, как инструмент мышления")
    - `meta_description` (text) - Default meta description for the site
    - `og_image_url` (text) - Default Open Graph image URL
    - `og_title` (text) - Default Open Graph title (optional, falls back to site_name + site_tagline)
    - `og_description` (text) - Default Open Graph description (optional, falls back to meta_description)
  
  2. Notes
    - These fields will be used for SEO and social media sharing
    - og_image_url should be a full URL to an image (recommended 1200x630px)
    - If og_title/og_description are not set, the system will use fallbacks
*/

-- Add SEO and Open Graph fields to site_settings
DO $$
BEGIN
  -- Add site_tagline field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'site_tagline'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN site_tagline text DEFAULT '';
  END IF;

  -- Add meta_description field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN meta_description text DEFAULT '';
  END IF;

  -- Add og_image_url field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'og_image_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN og_image_url text DEFAULT '';
  END IF;

  -- Add og_title field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'og_title'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN og_title text DEFAULT '';
  END IF;

  -- Add og_description field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'og_description'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN og_description text DEFAULT '';
  END IF;
END $$;