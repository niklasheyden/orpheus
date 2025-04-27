import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe key not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Fetching session from Stripe:', sessionId);
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          "Authorization": `Bearer ${stripeKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const session = await response.json();
    console.log('Stripe session response:', session);

    if (!response.ok) {
      console.error('Stripe API error:', session);
      return new Response(
        JSON.stringify({ 
          error: "Failed to verify session with Stripe",
          details: session.error?.message || "Unknown error"
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    if (session.payment_status !== "paid") {
      console.log('Payment not completed:', session.payment_status);
      return new Response(
        JSON.stringify({
          error: "Payment not completed",
          details: { payment_status: session.payment_status }
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Session verified successfully');
    return new Response(
      JSON.stringify({
        success: true,
        status: "complete",
        session: {
          id: session.id,
          customer: session.customer,
          payment_status: session.payment_status,
          subscription: session.subscription
        }
      }),
      { 
        status: 200,
        headers: corsHeaders 
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: "Failed to verify session",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}); 