import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Stripe
try {
  console.log('Starting function initialization');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  console.log('Stripe key found, initializing Stripe client');
  
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  console.log('Supabase credentials found, initializing client');
  
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  serve(async (req) => {
    console.log('Received request:', req.method);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        console.log('Method not allowed:', req.method);
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Parsing request body');
      const body = await req.json();
      const { priceId, userId, successUrl, cancelUrl } = body;
      console.log('Request parameters:', { priceId, userId, hasSuccessUrl: !!successUrl, hasCancelUrl: !!cancelUrl });

      // Validate required fields
      if (!priceId || !userId || !successUrl || !cancelUrl) {
        console.log('Missing required fields:', { priceId, userId, hasSuccessUrl: !!successUrl, hasCancelUrl: !!cancelUrl });
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Getting user from Supabase');
      const { data: user, error: userError } = await supabaseClient.auth.admin.getUserById(userId);

      if (userError || !user) {
        console.log('User not found:', { error: userError });
        return new Response(
          JSON.stringify({ error: 'User not found', details: userError }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Checking for existing Stripe customer');
      const { data: subscription, error: subscriptionError } = await supabaseClient
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (subscriptionError) {
        console.log('Error fetching subscription:', subscriptionError);
        return new Response(
          JSON.stringify({ error: 'Error fetching subscription', details: subscriptionError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let customerId: string;

      if (subscription?.stripe_customer_id) {
        console.log('Found existing Stripe customer:', subscription.stripe_customer_id);
        customerId = subscription.stripe_customer_id;
      } else {
        console.log('Creating new Stripe customer');
        try {
          const customer = await stripe.customers.create({
            metadata: { userId }
          });
          customerId = customer.id;
          console.log('Created Stripe customer:', customerId);

          console.log('Storing Stripe customer ID in Supabase');
          const { error: insertError } = await supabaseClient
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              stripe_customer_id: customerId,
              tier: 'free',
              status: 'trialing'
            });

          if (insertError) {
            console.log('Error storing customer ID:', insertError);
            return new Response(
              JSON.stringify({ error: 'Error storing customer ID', details: insertError }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (stripeError) {
          console.log('Error creating Stripe customer:', stripeError);
          return new Response(
            JSON.stringify({ error: 'Error creating Stripe customer', details: stripeError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('Creating Stripe checkout session');
      try {
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        console.log('Created checkout session:', { sessionId: session.id, url: session.url, customerId, userId });
        return new Response(
          JSON.stringify({ 
            id: session.id,
            url: session.url 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (stripeError) {
        console.log('Error creating checkout session:', stripeError);
        return new Response(
          JSON.stringify({ error: 'Error creating checkout session', details: stripeError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('Unexpected error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  });
} catch (initError) {
  console.error('Initialization error:', initError);
  serve(() => new Response(
    JSON.stringify({ error: 'Service configuration error', details: initError.message }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  ));
} 