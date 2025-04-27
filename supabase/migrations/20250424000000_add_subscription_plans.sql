-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  features text[] NOT NULL,
  tier text NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  stripe_price_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read subscription plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (true);

-- Insert initial subscription plans
INSERT INTO subscription_plans (name, description, price, interval, features, tier, stripe_price_id)
VALUES
  ('Free', 'Perfect for getting started', 0, 'month', 
   ARRAY[
     'Generate up to 3 research podcasts per month',
     'Basic customization options',
     'Community support'
   ],
   'free',
   'price_1RHQfVEtdxeZhSaSIq0nEOPj'
  ),
  ('Free', 'Perfect for getting started', 0, 'year', 
   ARRAY[
     'Generate up to 3 research podcasts per month',
     'Basic customization options',
     'Community support'
   ],
   'free',
   'price_1RHQo8EtdxeZhSaSCItnkzJV'
  ),
  ('Pro', 'For active researchers and creators', 19.99, 'month',
   ARRAY[
     'Unlimited research podcasts',
     'Advanced customization options',
     'Priority support',
     'Custom podcast cover images',
     'Analytics and insights'
   ],
   'pro',
   'price_1RHQlDEtdxeZhSaSwXk5Mltw'
  ),
  ('Pro', 'For active researchers and creators', 191.90, 'year',
   ARRAY[
     'Unlimited research podcasts',
     'Advanced customization options',
     'Priority support',
     'Custom podcast cover images',
     'Analytics and insights',
     'Save 20% with annual billing'
   ],
   'pro',
   'price_1RHQnVEtdxeZhSaSmMYphOjl'
  ),
  ('Enterprise', 'For research teams and institutions', 49.99, 'month',
   ARRAY[
     'Everything in Pro',
     'Team collaboration features',
     'Custom branding',
     'API access',
     'Dedicated support',
     'Training and onboarding'
   ],
   'enterprise',
   'price_1RHQlZEtdxeZhSaSi0iD7LA8'
  ),
  ('Enterprise', 'For research teams and institutions', 479.90, 'year',
   ARRAY[
     'Everything in Pro',
     'Team collaboration features',
     'Custom branding',
     'API access',
     'Dedicated support',
     'Training and onboarding',
     'Save 20% with annual billing'
   ],
   'enterprise',
   'price_1RHQnpEtdxeZhSaSOf991QiL'
  )
ON CONFLICT (id) DO NOTHING; 