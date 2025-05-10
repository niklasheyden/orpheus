import { supabase } from '../lib/supabase';
import { CheckoutSession, SubscriptionPlan, UserSubscription } from '../types/subscription';

// Get all available subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }

  return data as SubscriptionPlan[];
};

// Get the current user's subscription
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    return data as UserSubscription | null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
};

// Create a checkout session for a subscription
export const createCheckoutSession = async (
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSession> => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, userId, successUrl, cancelUrl }
  });

  if (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }

  return data as CheckoutSession;
};

// Create a customer portal session for managing subscriptions
export const createCustomerPortalSession = async (
  userId: string,
  returnUrl: string
): Promise<{ url: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    console.log('Creating customer portal session for user:', userId);
    console.log('Return URL:', returnUrl);

    const { data, error } = await supabase.functions.invoke(
      'create-customer-portal-session',
      {
        method: 'POST',
        body: JSON.stringify({
          userId,
          returnUrl
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }

    if (!data?.url) {
      console.error('No URL in response:', data);
      throw new Error('No URL returned from portal session creation');
    }

    console.log('Portal session created successfully');
    return data as { url: string };
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    throw error;
  }
};

// Sync subscription status with Stripe
export const syncSubscription = async (userId: string): Promise<void> => {
  if (!userId) {
    console.error('syncSubscription called without a valid userId');
    return;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }
    console.log('Invoking sync-subscription with userId:', userId);
    const { data, error } = await supabase.functions.invoke('sync-subscription', {
      body: JSON.stringify({ userId }),
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    console.log('Sync subscription response:', { data, error });
    if (error) {
      console.error('Error syncing subscription:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to sync subscription:', error);
    throw error;
  }
}; 