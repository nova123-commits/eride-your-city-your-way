import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ride_id } = await req.json();
    if (!ride_id) {
      return new Response(JSON.stringify({ error: "ride_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ride, error: rideErr } = await supabase
      .from("rides")
      .select("*")
      .eq("id", ride_id)
      .single();

    if (rideErr || !ride) {
      return new Response(JSON.stringify({ error: "Ride not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ride.status !== "requested") {
      return new Response(JSON.stringify({ error: `Cannot assign driver: ride status is ${ride.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: drivers } = await supabase
      .from("driver_locations")
      .select("driver_id, latitude, longitude")
      .eq("is_online", true);

    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ error: "No drivers available", assigned: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pickupLat = ride.pickup_lat ?? 0;
    const pickupLng = ride.pickup_lng ?? 0;

    const toRad = (d: number) => (d * Math.PI) / 180;
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const candidates = drivers
      .map((d: { driver_id: string; latitude: number; longitude: number }) => ({
        ...d,
        distance: haversine(pickupLat, pickupLng, d.latitude, d.longitude),
      }))
      .filter((d) => d.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No drivers within range", assigned: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assignedDriver = candidates[0];
    const now = new Date().toISOString();

    await supabase.from("rides").update({
      driver_id: assignedDriver.driver_id,
      status: "driver_assigned",
      updated_at: now,
    }).eq("id", ride_id);

    await supabase.from("ride_status_history").insert({
      ride_id,
      from_status: "requested",
      to_status: "driver_assigned",
      changed_by: assignedDriver.driver_id,
    });

    return new Response(JSON.stringify({
      assigned: true,
      driver_id: assignedDriver.driver_id,
      distance_km: Math.round(assignedDriver.distance * 10) / 10,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
