import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { 
  getSubscriptionPlans, 
  getUserSubscription, 
  createCheckoutSession,
  createCustomerPortalSession,
  syncSubscription
} from '../services/subscriptionService';
import { SubscriptionPlan, UserSubscription } from '../types/subscription';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { CheckoutSession } from '../types/subscription';
import { useNavigate } from 'react-router-dom';

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Get all subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: getSubscriptionPlans,
  });

  // Get user's current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery<UserSubscription | null>({
    queryKey: ['userSubscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First get the subscription from the database
      const dbSubscription = await getUserSubscription(user.id);
      
      // If we have a subscription, sync it with Stripe
      if (dbSubscription?.stripe_subscription_id) {
        try {
          await syncSubscription(user.id);
          // Fetch the updated subscription
          return await getUserSubscription(user.id);
        } catch (error) {
          console.error('Error syncing subscription:', error);
          // Return the un-synced subscription if sync fails
          return dbSubscription;
        }
      }
      
      return dbSubscription;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Verify checkout session mutation
  const verifyCheckoutSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      console.log('Starting verification process');
      console.log('Session ID:', sessionId);

      const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
        body: { sessionId }
      });

      if (error) {
        console.error('Verification process failed:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No response data received from verification endpoint');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Verification successful:', data);
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      showToast({
        title: 'Success',
        message: 'Your subscription has been activated!',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      console.error('Final verification error:', {
        message: error.message,
        type: error.constructor.name
      });
      showToast({
        title: 'Subscription Verification Failed',
        message: 'Could not verify subscription. Please contact support if this persists.',
        type: 'error',
      });
      setTimeout(() => navigate('/pricing'), 3000);
    },
  });

  // Create checkout session mutation
  const createCheckoutSession = useMutation({
    mutationFn: async ({ priceId }: { priceId: string }) => {
      if (!user) throw new Error('User must be logged in');
      
      const successUrl = `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/pricing`;
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId,
          userId: user.id,
          successUrl,
          cancelUrl
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      showToast({
        title: 'Error',
        message: 'Failed to create checkout session. Please try again.',
        type: 'error',
      });
    },
  });

  // Create customer portal session mutation
  const createCustomerPortalMutation = useMutation({
    mutationFn: async ({ userId, returnUrl }: { userId: string; returnUrl: string }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User must be logged in');
      }

      // Create return URL with access token
      const accountUrl = new URL(`${window.location.origin}/account`);
      accountUrl.searchParams.set('access_token', session.access_token);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId, returnUrl: accountUrl.toString() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error('No portal URL received');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      console.error('Portal session error:', error);
      showToast({
        title: 'Subscription Management Error',
        message: error.message || 'Could not access subscription management. Please try again later.',
        type: 'error',
      });
    },
  });

  // Helper function to check if user has a specific subscription tier
  const hasTier = (tier: string): boolean => {
    if (!subscription) return tier === 'free';
    return subscription.tier === tier;
  };

  // Helper function to check if user has an active subscription
  const hasActiveSubscription = (): boolean => {
    return !!subscription && subscription.status === 'active';
  };

  return {
    plans,
    subscription,
    isLoadingPlans,
    isLoadingSubscription,
    createCheckoutSession: createCheckoutSession.mutate,
    verifyCheckoutSession: verifyCheckoutSession.mutate,
    createCustomerPortalSession: createCustomerPortalMutation.mutate,
    hasTier,
    hasActiveSubscription,
  };
}; 