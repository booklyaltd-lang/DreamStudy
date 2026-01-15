/*
  # Исправление политик RLS для тарифных планов
  
  1. Изменения
    - Удаляем старую политику "Admins can manage tiers"
    - Создаем отдельные политики для INSERT, UPDATE, DELETE
    - Каждая политика проверяет роль администратора
  
  2. Безопасность
    - Только администраторы могут управлять тарифами
    - Все пользователи могут просматривать активные тарифы
*/

-- Удаляем старую политику если существует
DROP POLICY IF EXISTS "Admins can manage tiers" ON pricing_tiers;

-- Создаем политику для INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pricing_tiers' 
    AND policyname = 'Admins can insert tiers'
  ) THEN
    CREATE POLICY "Admins can insert tiers"
      ON pricing_tiers FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Создаем политику для UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pricing_tiers' 
    AND policyname = 'Admins can update tiers'
  ) THEN
    CREATE POLICY "Admins can update tiers"
      ON pricing_tiers FOR UPDATE
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
  END IF;
END $$;

-- Создаем политику для DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pricing_tiers' 
    AND policyname = 'Admins can delete tiers'
  ) THEN
    CREATE POLICY "Admins can delete tiers"
      ON pricing_tiers FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
