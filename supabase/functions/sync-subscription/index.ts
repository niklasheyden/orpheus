import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { userId } = await req.json();
    console.log('Syncing subscription for user:', userId);

    if (!userId) {
      throw new Error('Missing required fields');
    }

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // First, get the customer ID from the users table
    console.log('Fetching customer ID from users table...');
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!userResponse.ok) {
      console.error('Failed to fetch user data:', await userResponse.text());
      throw new Error('Failed to fetch user data');
    }

    const users = await userResponse.json();
    console.log('User data:', users);
    
    const stripeCustomerId = users[0]?.stripe_customer_id;
    console.log('Stripe customer ID:', stripeCustomerId);

    if (!stripeCustomerId) {
      console.log('No Stripe customer ID found for user');
      // If no customer ID, check if there's an existing subscription to clean up
      const existingSubResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
        }
      );

      if (!existingSubResponse.ok) {
        throw new Error('Failed to check existing subscriptions');
      }

      const existingSubs = await existingSubResponse.json();
      if (existingSubs.length > 0) {
        // Delete any existing subscriptions since there's no customer ID
        const deleteResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
            },
          }
        );

        if (!deleteResponse.ok) {
          throw new Error('Failed to delete existing subscriptions');
        }
      }

      return new Response(JSON.stringify({ 
        status: 'no_subscription',
        message: 'User has no Stripe customer ID' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get all subscriptions for the customer from Stripe
    console.log('Fetching subscriptions from Stripe...');
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      expand: ['data.items.data.price.product'],
    });

    console.log('Stripe subscriptions:', subscriptions.data);

    // Find the most recent active or trialing subscription
    const activeSubscription = subscriptions.data.find(sub => 
      ['active', 'trialing'].includes(sub.status)
    );

    console.log('Active subscription:', activeSubscription);

    if (!activeSubscription) {
      console.log('No active subscription found in Stripe');
      // Delete any existing subscriptions in the database
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete existing subscriptions');
      }

      return new Response(JSON.stringify({ 
        status: 'no_subscription',
        message: 'No active subscription found' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get the product details to determine the tier
    const product = await stripe.products.retrieve(
      activeSubscription.items.data[0].price.product as string
    );
    
    const tier = product.metadata.tier || 'free';

    console.log('Updating subscription in database...', {
      status: activeSubscription.status,
      tier,
      subscription_id: activeSubscription.id
    });

    // Update or insert the subscription
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: activeSubscription.id,
          status: activeSubscription.status,
          tier: tier,
          current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: activeSubscription.cancel_at_period_end,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update subscription in database:', errorText);
      throw new Error('Failed to update subscription in database');
    }

    const updatedData = {
      status: activeSubscription.status,
      tier,
      current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
    };

    console.log('Successfully updated subscription:', updatedData);

    return new Response(JSON.stringify({ 
      success: true,
      subscription: updatedData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    
    const status = error.message === 'Method not allowed' ? 405 :
                   error.message === 'Missing required fields' ? 400 :
                   error.message === 'No subscription found' ? 404 : 500;

    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error instanceof Error ? error.stack : String(error)
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 