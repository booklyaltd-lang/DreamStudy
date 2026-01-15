/*
  # Добавление хранилища для ресурсов сайта

  1. Новый бакет Storage
    - `site-assets` - ресурсы сайта (логотипы, изображения)
      - Публичный доступ на чтение
      - Загрузка для администраторов
      - Поддержка форматов: JPEG, PNG, WebP, GIF, SVG
      - Лимит размера файла: 5MB

  2. Политики безопасности
    - Публичный доступ на чтение
    - Загрузка, обновление и удаление только для администраторов
*/

-- Создаем бакет site-assets если его нет
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('site-assets', 'site-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "site_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_delete" ON storage.objects;

-- Создаем политики для site-assets
CREATE POLICY "site_assets_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "site_assets_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "site_assets_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "site_assets_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
