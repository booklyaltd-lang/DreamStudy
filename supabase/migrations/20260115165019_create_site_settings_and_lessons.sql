/*
  # Создание таблиц настроек сайта и уроков курсов

  1. Новые таблицы
    - `site_settings` - настройки сайта (логотип, тексты, цвета, соцсети)
      - `id` (uuid, primary key)
      - `site_name` (text) - название сайта
      - `logo_url` (text) - URL логотипа
      - `hero_title` (text) - заголовок на главной
      - `hero_description` (text) - описание на главной
      - `hero_cta_text` (text) - текст кнопки CTA
      - `hero_background_color` (text) - цвет фона героя
      - `hero_background_opacity` (numeric) - прозрачность фона
      - `footer_description` (text) - описание в футере
      - `about_title` (text) - заголовок блока О платформе
      - `about_description` (text) - текст блока О платформе
      - `about_image_url` (text) - изображение блока О платформе
      - `social_links` (jsonb) - массив ссылок на соцсети
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `course_lessons` - уроки курсов
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key) - связь с курсом
      - `title` (text) - название урока
      - `slug` (text) - URL урока
      - `content` (text) - содержимое урока (HTML)
      - `order_index` (integer) - порядок урока
      - `duration_minutes` (integer) - длительность урока
      - `video_url` (text) - URL видео
      - `video_type` (text) - тип видео (upload, youtube, vimeo, html)
      - `is_published` (boolean) - опубликован ли
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Безопасность
    - Включить RLS для обеих таблиц
    - Настроить политики доступа
*/

-- Создаем таблицу настроек сайта
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'EduPlatform',
  logo_url text DEFAULT '',
  hero_title text DEFAULT 'Учитесь онлайн в удобном темпе',
  hero_description text DEFAULT 'Получите доступ к тысячам экспертных курсов и улучшите свои навыки',
  hero_cta_text text DEFAULT 'Начать обучение',
  hero_background_color text DEFAULT '#3b82f6',
  hero_background_opacity numeric DEFAULT 1.0,
  footer_description text DEFAULT 'Расширяем возможности учащихся по всему миру с помощью качественных онлайн-курсов и образовательного контента.',
  about_title text DEFAULT 'О нашей платформе',
  about_description text DEFAULT 'Мы создаем современное образовательное пространство, где каждый может найти курсы для развития своих навыков и достижения целей.',
  about_image_url text DEFAULT '',
  social_links jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Вставляем начальные настройки
INSERT INTO site_settings (id) VALUES (gen_random_uuid())
ON CONFLICT (id) DO NOTHING;

-- Включаем RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Политики для настроек сайта
CREATE POLICY "Everyone can view site settings"
  ON site_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Создаем таблицу уроков курсов
CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text DEFAULT '',
  order_index integer DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  video_url text DEFAULT '',
  video_type text DEFAULT 'youtube',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, slug)
);

-- Создаем индекс для быстрого поиска уроков по курсу
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(course_id, order_index);

-- Включаем RLS
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

-- Политики для уроков
CREATE POLICY "Everyone can view published lessons"
  ON course_lessons FOR SELECT
  TO authenticated, anon
  USING (is_published = true);

CREATE POLICY "Admins can view all lessons"
  ON course_lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert lessons"
  ON course_lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update lessons"
  ON course_lessons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lessons"
  ON course_lessons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );