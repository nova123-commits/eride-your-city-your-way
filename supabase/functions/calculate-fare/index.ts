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
    const { distance_km, category } = await req.json();

    if (!distance_km || !category) {
      return new Response(JSON.stringify({ error: "distance_km and category are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key,value");

    const cfg: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      cfg[s.key] = s.value;
    });

    const baseFare = parseFloat(cfg.base_fare ?? "100");
    const perKm = parseFloat(cfg.per_km_price ?? "20");
    const perMin = parseFloat(cfg.per_minute_price ?? "5");
    const minFare = parseFloat(cfg.minimum_fare ?? "150");
    const commissionPercent = parseFloat(cfg.driver_commission_percent ?? "15");

    const categoryMultiplier = category === "xtra" ? 2.5 : category === "boda" ? 0.5 : 1.0;

    const now = new Date();
    const hour = now.getHours();
    const dow = now.getDay();

    const { data: surgeRules } = await supabase
      .from("surge_rules")
      .select("*")
      .eq("is_active", true);

    let surgeMultiplier = 1.0;
    surgeRules?.forEach((rule: { day_of_week: number[] | null; start_hour: number; end_hour: number; multiplier: number }) => {
      const dayMatch = !rule.day_of_week || rule.day_of_week.length === 0 || rule.day_of_week.includes(dow);
      if (dayMatch && hour >= rule.start_hour && hour < rule.end_hour) {
        surgeMultiplier = Math.max(surgeMultiplier, rule.multiplier);
      }
    });

    const estimatedMinutes = Math.round(distance_km * 3);
    const rawFare = (baseFare + (distance_km * perKm) + (estimatedMinutes * perMin)) * categoryMultiplier * surgeMultiplier;
    const fare = Math.max(Math.round(rawFare), minFare);
    const commission = Math.round(fare * (commissionPercent / 100));
    const driverPayout = fare - commission;

    const breakdown = {
      base_fare: Math.round(baseFare * categoryMultiplier),
      distance_charge: Math.round(distance_km * perKm * categoryMultiplier),
      time_charge: Math.round(estimatedMinutes * perMin * categoryMultiplier),
      surge_multiplier: surgeMultiplier,
      surge_applied: surgeMultiplier > 1,
      subtotal: Math.round(rawFare / surgeMultiplier),
      total_fare: fare,
      commission,
      driver_payout: driverPayout,
      currency: cfg.currency ?? "KES",
      category,
      distance_km,
      estimated_minutes: estimatedMinutes,
    };

    return new Response(JSON.stringify(breakdown), {
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
