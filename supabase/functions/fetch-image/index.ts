import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, userId } = await req.json();

    if (!prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Prompt and userId are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Call OpenAI DALL-E API
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return new Response(JSON.stringify({ error: `OpenAI error: ${err}` }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const openaiData = await openaiRes.json();
    const imageUrl = openaiData.data?.[0]?.url;
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'No image URL returned from OpenAI' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageData = new Uint8Array(await imageResponse.arrayBuffer());

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${userId}/covers/${timestamp}-${randomString}.png`;

    const { error: uploadError } = await supabase.storage
      .from('podcasts')
      .upload(filename, imageData, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: `Failed to upload image: ${uploadError.message}` }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Get the public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/podcasts/${filename}`;

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});