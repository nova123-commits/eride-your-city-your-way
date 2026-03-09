import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { phone, amount } = await req.json();

    // Validate inputs
    if (!phone || typeof phone !== "string" || phone.length < 9) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 150000) {
      return new Response(JSON.stringify({ error: "Amount must be between 1 and 150,000 KES" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simulate STK push delay
    await new Promise((r) => setTimeout(r, 2000));

    // Calculate fee (simulated: 1% of amount, min 5 KES)
    const fee = Math.max(5, Math.round(numAmount * 0.01));

    // Use service role for admin operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log transaction
    const { error: txError } = await adminClient.from("wallet_transactions").insert({
      user_id: userId,
      amount: numAmount,
      fee,
      type: "credit",
      label: "M-Pesa STK Push Deposit",
      phone,
      status: "completed",
    });

    if (txError) {
      console.error("Transaction insert error:", txError);
      return new Response(JSON.stringify({ error: "Failed to log transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update wallet balance
    const { data: wallet } = await adminClient
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const newBalance = (wallet?.balance ?? 0) + numAmount;

    const { error: walletError } = await adminClient
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (walletError) {
      console.error("Wallet update error:", walletError);
      return new Response(JSON.stringify({ error: "Failed to update wallet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `STK Push simulated. KES ${numAmount} deposited to wallet.`,
        transaction: {
          amount: numAmount,
          fee,
          phone,
          new_balance: newBalance,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
