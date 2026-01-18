/*
  # Add YooKassa Payments Tracking Table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `yookassa_payment_id` (text, unique) - ID платежа от ЮKassa
      - `amount` (numeric) - Сумма платежа
      - `currency` (text) - Валюта (RUB)
      - `status` (text) - Статус платежа (pending, succeeded, canceled)
      - `payment_type` (text) - Тип платежа (subscription, course)
      - `subscription_id` (uuid, nullable, references user_subscriptions)
      - `course_id` (uuid, nullable, references courses)
      - `metadata` (jsonb) - Дополнительные данные
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on payments table
    - Users can view their own payments
    - Admins can view all payments
    - System can insert/update payments (for webhook)

  3. Indexes
    - Add index for yookassa_payment_id (unique)
    - Add index for user_id lookups
    - Add index for status lookups
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  yookassa_payment_id text UNIQUE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'RUB',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'canceled', 'waiting_for_capture')),
  payment_type text NOT NULL CHECK (payment_type IN ('subscription', 'course')),
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger for payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
