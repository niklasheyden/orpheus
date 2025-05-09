import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    // Re-create the request with the raw body for further processing
    const reqWithBody = new Request(req.url, { method: req.method, headers: req.headers, body: rawBody });
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }
    // Robust JSON parsing
    let userId;
    try {
      const body = rawBody ? JSON.parse(rawBody) : {};
      userId = body.userId;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or missing JSON body" }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    // First, get the customer ID from the user_subscriptions table
    console.log('Fetching customer ID from user_subscriptions table...');
    const subResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    if (!subResponse.ok) {
      console.error('Failed to fetch user data:', await subResponse.text());
      throw new Error('Failed to fetch user data');
    }

    const dbSubscriptions = await subResponse.json();
    console.log('Subscription data:', dbSubscriptions);
    
    const stripeCustomerId = dbSubscriptions[0]?.stripe_customer_id;
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

    // Before upsert: delete any row with the same stripe_customer_id but a different user_id
    await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?stripe_customer_id=eq.${stripeCustomerId}&user_id=neq.${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    // Get all subscriptions for the customer from Stripe
    console.log('Fetching subscriptions from Stripe...');
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      expand: ['data.items.data.price'],
    });

    console.log('Stripe subscriptions:', stripeSubscriptions.data);

    // Find the most recent active or trialing subscription
    const activeSubscription = stripeSubscriptions.data.find(sub => 
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
      `${supabaseUrl}/rest/v1/user_subscriptions?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify([
          {
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: activeSubscription.id,
            status: activeSubscription.status,
            tier: tier,
            current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: activeSubscription.cancel_at_period_end,
          }
        ]),
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