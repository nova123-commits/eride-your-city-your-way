import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tripType, distance, pickup, destination } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an AI ride-matching optimizer for eRide, a ride-hailing platform in Kenya.
Analyze the trip details and return a JSON object with:
- preferredDriverType: "long_distance" | "short_hop" | "airport_specialist" | "city_cruiser"
- reasoning: brief explanation
- suggestedCategory: best ride category for this trip
- estimatedDemand: "low" | "medium" | "high"

Consider: Airport trips (JKIA, Wilson) should match with airport specialists. 
Long trips (>15km) should match long-distance drivers.
Short trips (<5km) should match city cruisers for faster pickup.`
          },
          {
            role: "user",
            content: `Trip details: From "${pickup}" to "${destination}", distance ${distance}km, type: ${tripType}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "match_driver",
            description: "Return driver matching recommendation",
            parameters: {
              type: "object",
              properties: {
                preferredDriverType: { type: "string", enum: ["long_distance", "short_hop", "airport_specialist", "city_cruiser"] },
                reasoning: { type: "string" },
                suggestedCategory: { type: "string" },
                estimatedDemand: { type: "string", enum: ["low", "medium", "high"] }
              },
              required: ["preferredDriverType", "reasoning", "suggestedCategory", "estimatedDemand"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "match_driver" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI matching failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : {
      preferredDriverType: "city_cruiser",
      reasoning: "Default matching",
      suggestedCategory: "basic",
      estimatedDemand: "medium"
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("ride-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
