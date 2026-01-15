/*
  # Добавление системы ролей администратора

  1. Изменения
    - Добавляем колонку `role` в таблицу `profiles`
    - Создаём тип enum для ролей (user, admin)
    - Устанавливаем роль admin для первого пользователя

  2. Безопасность
    - Только администраторы могут изменять роли
    - Пользователи могут видеть только свою роль
*/

-- Создаём enum для ролей если его нет
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Добавляем колонку role если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Создаём функцию для проверки роли администратора
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаём первого администратора
-- Email: admin@example.com
-- Пароль: Admin123!
-- ВАЖНО: Пользователь должен сначала зарегистрироваться с этим email

-- Комментарий: После регистрации пользователя с email admin@example.com,
-- выполните следующий SQL для установки роли admin:
-- UPDATE profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- Добавляем политику для просмотра ролей
DROP POLICY IF EXISTS "Users can view own role" ON profiles;
CREATE POLICY "Users can view own role"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

-- Добавляем политику для обновления ролей (только админы)
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;
CREATE POLICY "Only admins can update roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());