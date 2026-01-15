/*
  # Создание хранилищ для файлов (безопасная версия)

  1. Новые бакеты Storage
    - `course-images` - изображения курсов
    - `blog-images` - изображения для блога
    - `avatars` - аватары пользователей
    - `course-materials` - материалы курсов

  2. Политики безопасности
    - Публичный доступ на чтение изображений
    - Загрузка для авторизованных пользователей
*/

-- Создаем бакеты если их нет
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('course-images', 'course-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('course-materials', 'course-materials', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'])
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Авторизованные пользователи могу" ON storage.objects;
DROP POLICY IF EXISTS "Публичный доступ на чтение изображений курсов" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут загружать изображения курсов" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут обновлять изображения курсов" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут удалять изображения курсов" ON storage.objects;
DROP POLICY IF EXISTS "Публичный доступ на чтение изображений блога" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут загружать изображения блога" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут обновлять изображения блога" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут удалять изображения блога" ON storage.objects;
DROP POLICY IF EXISTS "Публичный доступ на чтение аватаров" ON storage.objects;
DROP POLICY IF EXISTS "Пользователи могут загружать свои аватары" ON storage.objects;
DROP POLICY IF EXISTS "Пользователи могут обновлять свои аватары" ON storage.objects;
DROP POLICY IF EXISTS "Пользователи могут удалять свои аватары" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут читать материалы курсов" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут загружать материалы курсов" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут обновлять материалы курсов" ON storage.objects;
DROP POLICY IF EXISTS "Авторизованные пользователи могут удалять материалы курсов" ON storage.objects;

-- Создаем политики для course-images
CREATE POLICY "course_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-images');

CREATE POLICY "course_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "course_images_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-images');

CREATE POLICY "course_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-images');

-- Создаем политики для blog-images
CREATE POLICY "blog_images_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "blog_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "blog_images_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "blog_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images');

-- Создаем политики для avatars
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Создаем политики для course-materials
CREATE POLICY "materials_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "materials_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "materials_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "materials_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-materials');