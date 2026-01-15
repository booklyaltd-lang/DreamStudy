/*
  # Создание таблицы тарифных планов

  1. Новая таблица
    - `pricing_tiers` - тарифные планы
      - `id` (uuid, primary key)
      - `name` (text) - название тарифа (Free, Basic, Premium)
      - `slug` (text) - уникальный идентификатор
      - `price_monthly` (numeric) - цена в месяц
      - `price_yearly` (numeric) - цена в год
      - `features` (jsonb) - список функций
      - `is_active` (boolean) - активен ли тариф
      - `sort_order` (integer) - порядок сортировки
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Безопасность
    - Включить RLS
    - Настроить политики доступа
*/

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price_monthly numeric DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Вставляем стандартные тарифы
INSERT INTO pricing_tiers (name, slug, price_monthly, price_yearly, features, sort_order) VALUES
('Free', 'free', 0, 0, '["Доступ к бесплатным курсам", "Базовая поддержка"]'::jsonb, 1),
('Basic', 'basic', 990, 9990, '["Доступ ко всем курсам Basic", "Email поддержка", "Сертификаты"]'::jsonb, 2),
('Premium', 'premium', 1990, 19990, '["Доступ ко всем курсам", "Приоритетная поддержка", "Сертификаты", "Индивидуальные консультации"]'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active tiers"
  ON pricing_tiers FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage tiers"
  ON pricing_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );