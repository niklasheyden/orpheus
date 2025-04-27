import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { userId, returnUrl } = await req.json();

    if (!userId) {
      throw new Error('Missing required fields');
    }

    // Extract origin from returnUrl or use a default
    const origin = returnUrl ? new URL(returnUrl).origin : 'https://orpheus-ai.vercel.app';
    const accountUrl = `${origin}/account`;

    // Query Supabase directly using fetch
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
      }
    );

    const subscriptions = await response.json();
    const subscription = subscriptions[0];

    if (!subscription?.stripe_customer_id) {
      throw new Error('No active subscription found');
    }

    // Create basic portal session with account page as return URL
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: accountUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
                   error.message === 'No active subscription found' ? 404 : 500;

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