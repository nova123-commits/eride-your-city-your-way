import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { origins, destinations } = await req.json();

    if (!origins?.length || !destinations?.length) {
      return new Response(JSON.stringify({ error: 'origins and destinations arrays required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      origins: origins.join('|'),
      destinations: destinations.join('|'),
      departure_time: 'now',
      traffic_model: 'best_guess',
      key: GOOGLE_MAPS_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      return new Response(JSON.stringify({ error: `Google API error: ${data.status}`, details: data.error_message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Flatten results into a simple array
    const results = data.rows.flatMap((row: any, ri: number) =>
      row.elements.map((el: any, di: number) => ({
        origin: data.origin_addresses[ri],
        destination: data.destination_addresses[di],
        distance: el.distance,
        duration: el.duration,
        duration_in_traffic: el.duration_in_traffic,
        status: el.status,
      }))
    );

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
