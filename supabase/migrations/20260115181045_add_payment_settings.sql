/*
  # Добавление настроек платежной системы
  
  1. Изменения
    - Добавляем поле `payment_provider` - название платежной системы (stripe, yookassa и т.д.)
    - Добавляем поле `payment_api_key` - API ключ платежной системы
    - Добавляем поле `payment_secret_key` - секретный ключ платежной системы
    - Добавляем поле `payment_webhook_secret` - секрет для вебхуков
    - Добавляем поле `payment_enabled` - включены ли платежи
  
  2. Безопасность
    - Данные чувствительны, доступ только для администраторов через существующие RLS политики
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_provider text DEFAULT 'stripe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_api_key'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_api_key text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_secret_key'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_secret_key text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_webhook_secret'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_webhook_secret text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_enabled'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_enabled boolean DEFAULT false;
  END IF;
END $$;
