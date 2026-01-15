/*
  # Добавление полей в таблицу blog_posts

  1. Изменения
    - Добавить поле `required_tier` - требуемая подписка для доступа
    - Добавить поле `content_html` - HTML контент статьи
    - Добавить поле `video_url` - URL видео в статье
    - Добавить поле `video_type` - тип видео (upload, youtube, vimeo, html)
*/

-- Добавляем новые поля, если они еще не существуют
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'required_tier'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN required_tier text DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'content_html'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN content_html text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN video_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'video_type'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN video_type text DEFAULT 'youtube';
  END IF;
END $$;