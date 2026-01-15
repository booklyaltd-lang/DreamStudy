/*
  # Create Video Storage Buckets

  1. New Storage Buckets
    - `lesson-videos` - for course lesson videos
    - `blog-videos` - for blog post videos
    - `content-images` - for images uploaded via rich text editor

  2. Security
    - Public access for reading videos and images
    - Authenticated users can upload/delete videos and images
    - File size limits enforced at application level
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'lesson-videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('lesson-videos', 'lesson-videos', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'blog-videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('blog-videos', 'blog-videos', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'content-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('content-images', 'content-images', true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Lesson videos are publicly accessible'
  ) THEN
    CREATE POLICY "Lesson videos are publicly accessible"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'lesson-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload lesson videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload lesson videos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'lesson-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete lesson videos'
  ) THEN
    CREATE POLICY "Authenticated users can delete lesson videos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'lesson-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Blog videos are publicly accessible'
  ) THEN
    CREATE POLICY "Blog videos are publicly accessible"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'blog-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload blog videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload blog videos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'blog-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete blog videos'
  ) THEN
    CREATE POLICY "Authenticated users can delete blog videos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'blog-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Content images are publicly accessible'
  ) THEN
    CREATE POLICY "Content images are publicly accessible"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'content-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload content images'
  ) THEN
    CREATE POLICY "Authenticated users can upload content images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'content-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete content images'
  ) THEN
    CREATE POLICY "Authenticated users can delete content images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'content-images');
  END IF;
END $$;
