import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
console.log('Webhook secret length:', webhookSecret.length);

// Get Supabase configuration
const projectRef = 'zlijfkjjtcmjuxdgojva';
const supabaseUrl = `https://${projectRef}.supabase.co`;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey ? supabaseKey.length : 0);
console.log('Project Ref:', projectRef);

if (!supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    // Test Supabase client authorization
    const { data: testData, error: testError } = await supabase.from('user_subscriptions').select('*').limit(1);
    console.log('Test query result:', { testData, testError });

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'stripe-signature, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    console.log('Received signature:', signature);
    
    if (!signature) {
      console.error('No stripe-signature header found');
      throw new Error('No signature found');
    }

    // Get the raw body
    const body = await req.text();
    console.log('Received webhook body:', body);
    
    // Verify the webhook signature
    let event;
    try {
      console.log('Attempting to verify signature with secret length:', webhookSecret.length);
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Signature verification successful');
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err);
      console.error('Error details:', err.message);
      throw new Error('Invalid signature');
    }

    console.log('Processing webhook event:', event.type);

    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the customer ID
        const customerId = subscription.customer as string;
        console.log('Processing subscription for customer:', customerId);
        
        // First, get the user ID from the users table
        const { data: users, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId);
        
        console.log('User query result:', { users, error: userError });
        
        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error(`Error fetching user: ${userError.message}`);
        }
        
        if (!users || users.length === 0) {
          throw new Error(`No user found for customer: ${customerId}`);
        }

        const userId = users[0].user_id;
        console.log('Found user ID:', userId);

        // Get the product details
        const product = await stripe.products.retrieve(
          subscription.items.data[0].price.product as string
        );
        
        const tier = product.metadata.tier || 'pro';
        console.log('Subscription tier:', tier);

        if (event.type === 'customer.subscription.deleted') {
          console.log('Deleting subscription for user:', userId);
          // Delete the subscription from the database
          const { error: deleteError } = await supabase
            .from('user_subscriptions')
            .delete()
            .eq('user_id', userId);
          
          if (deleteError) {
            console.error('Error deleting subscription:', deleteError);
            throw new Error(`Error deleting subscription: ${deleteError.message}`);
          }
          
          console.log('Subscription deleted successfully');
        } else {
          console.log('Updating subscription for user:', userId);
          // Update or insert the subscription
          const subscriptionData = {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            tier: tier,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          };
          
          console.log('Update data:', JSON.stringify(subscriptionData));
          
          const { error: upsertError } = await supabase
            .from('user_subscriptions')
            .upsert(subscriptionData, { 
              onConflict: 'stripe_customer_id'
            });
          
          if (upsertError) {
            console.error('Error updating subscription:', upsertError);
            throw new Error(`Error updating subscription: ${upsertError.message}`);
          }
          
          console.log('Subscription updated successfully');
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    const status = error.message === 'Method not allowed' ? 405 :
                   error.message === 'No signature found' ? 400 :
                   error.message === 'Invalid signature' ? 400 : 500;

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
