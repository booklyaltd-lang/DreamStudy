/*
  # Добавление поля avatar_url в таблицу профилей

  1. Изменения
    - Добавляем колонку `avatar_url` в таблицу `profiles`
    - Поле хранит URL аватара пользователя из Supabase Storage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;