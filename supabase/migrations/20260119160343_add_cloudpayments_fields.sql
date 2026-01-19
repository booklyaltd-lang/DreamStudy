/*
  # Добавление полей для CloudPayments

  1. Изменения
    - Добавляем поле `payment_cloudpayments_public_id` - Public ID для CloudPayments
    - Добавляем поле `payment_cloudpayments_api_password` - API пароль для CloudPayments

  2. Безопасность
    - Данные чувствительны, доступ только для администраторов через существующие RLS политики
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_cloudpayments_public_id'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_cloudpayments_public_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'payment_cloudpayments_api_password'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN payment_cloudpayments_api_password text DEFAULT '';
  END IF;
END $$;