-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  status text CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  tier text CHECK (tier IN ('free', 'pro', 'enterprise')),
  price_id text,
  quantity integer,
  cancel_at_period_end boolean DEFAULT false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_subscription_id_idx ON user_subscriptions(stripe_subscription_id); 