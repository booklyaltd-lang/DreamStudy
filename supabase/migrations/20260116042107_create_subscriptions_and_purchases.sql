/*
  # Create User Subscriptions and Course Purchases System

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `tier` (text, 'basic' or 'premium')
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `course_purchases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses)
      - `purchased_at` (timestamptz)
      - `price_paid` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can view their own subscriptions and purchases
    - Admins can view and manage all subscriptions and purchases

  3. Indexes
    - Add indexes for user_id lookups
    - Add index for active subscriptions
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tier text NOT NULL CHECK (tier IN ('basic', 'premium')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course_purchases table
CREATE TABLE IF NOT EXISTS course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  purchased_at timestamptz DEFAULT now(),
  price_paid numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON course_purchases(course_id);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete subscriptions"
  ON user_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for course_purchases
CREATE POLICY "Users can view own purchases"
  ON course_purchases
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert purchases"
  ON course_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update purchases"
  ON course_purchases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete purchases"
  ON course_purchases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_subscriptions
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
