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
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search for safe pickup points: gas stations, shopping malls, landmarks
    const types = ['gas_station', 'shopping_mall', 'point_of_interest'];
    const allPlaces: any[] = [];

    for (const type of types) {
      const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: '500',
        type,
        key: GOOGLE_MAPS_API_KEY,
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
      );
      const data = await response.json();

      if (data.results) {
        const typeMap: Record<string, string> = {
          gas_station: 'fuel',
          shopping_mall: 'mall',
          point_of_interest: 'landmark',
        };
        allPlaces.push(
          ...data.results.slice(0, 2).map((p: any) => ({
            name: p.name,
            address: p.vicinity || p.formatted_address || p.name,
            type: typeMap[type] || 'landmark',
          }))
        );
      }
    }

    // Deduplicate and take top 3
    const seen = new Set<string>();
    const points = allPlaces.filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    }).slice(0, 3);

    return new Response(JSON.stringify({ points }), {
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
