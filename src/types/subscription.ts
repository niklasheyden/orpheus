export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  tier: SubscriptionTier;
  stripe_price_id: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  tier: SubscriptionTier;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
} 