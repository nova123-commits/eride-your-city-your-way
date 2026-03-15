import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["driver_assigned", "cancelled"],
  driver_assigned: ["driver_arriving", "cancelled"],
  driver_arriving: ["ride_started", "cancelled"],
  ride_started: ["ride_completed", "cancelled"],
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

    // Get ride
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

    if (ride.status !== "ride_started") {
      return new Response(JSON.stringify({ error: `Cannot complete: ride status is ${ride.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load commission from settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key,value")
      .in("key", ["driver_commission_percent", "currency"]);

    const cfg: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      cfg[s.key] = s.value;
    });

    const commissionPercent = parseFloat(cfg.driver_commission_percent ?? "15");
    const finalFare = ride.final_fare ?? ride.estimated_fare;
    const commission = Math.round(finalFare * (commissionPercent / 100));
    const driverNet = finalFare - commission;
    const now = new Date().toISOString();

    // 1. Update ride to completed
    await supabase.from("rides").update({
      status: "ride_completed",
      final_fare: finalFare,
      completed_at: now,
      updated_at: now,
    }).eq("id", ride_id);

    // 2. Log transition
    await supabase.from("ride_status_history").insert({
      ride_id,
      from_status: "ride_started",
      to_status: "ride_completed",
      changed_by: ride.driver_id,
    });

    // 3. Create payment record
    await supabase.from("payments").insert({
      ride_id,
      payer_id: ride.rider_id,
      amount: finalFare,
      method: ride.payment_method,
      status: "completed",
      currency: cfg.currency ?? "KES",
    });

    // 4. Create driver payout record
    if (ride.driver_id) {
      await supabase.from("driver_payouts").insert({
        driver_id: ride.driver_id,
        ride_id,
        amount: finalFare,
        commission,
        net_amount: driverNet,
        status: "completed",
      });

      // 5. Credit driver wallet
      await supabase.from("wallets")
        .update({ balance: supabase.rpc ? undefined : 0 })
        .eq("user_id", ride.driver_id);

      // Use raw SQL via rpc would be better, but we'll do a select-then-update
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", ride.driver_id)
        .single();

      if (wallet) {
        await supabase.from("wallets").update({
          balance: wallet.balance + driverNet,
          updated_at: now,
        }).eq("user_id", ride.driver_id);
      }

      // 6. Log wallet transaction
      await supabase.from("wallet_transactions").insert({
        user_id: ride.driver_id,
        amount: driverNet,
        type: "credit",
        label: `Trip earnings (${commission} commission)`,
        status: "completed",
      });
    }

    // 7. Audit trail
    await supabase.from("audit_trail").insert({
      actor_id: ride.driver_id ?? ride.rider_id,
      actor_role: "system",
      action: "ride_completed",
      target_table: "rides",
      target_id: ride_id,
      details: { final_fare: finalFare, commission, driver_net: driverNet },
    });

    return new Response(JSON.stringify({
      completed: true,
      final_fare: finalFare,
      commission,
      driver_payout: driverNet,
      currency: cfg.currency ?? "KES",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
