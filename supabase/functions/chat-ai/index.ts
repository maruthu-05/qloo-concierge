import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const QLOO_BASE = "https://hackathon.api.qloo.com/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, preferences } = await req.json();
    console.log("Incoming:", { message, preferences });

    // Lookup entities or tags first
    const lookupPromises = [];
    if (preferences?.music) {
      lookupPromises.push(fetch(`${QLOO_BASE}/search?query=${encodeURIComponent(message)}&types=artist`, {
        headers: { "X-Api-Key": Deno.env.get("QLOO_API_KEY")! }
      }));
    }
    // Add more types as needed (movie, place, etc.)
    const lookups = await Promise.all(lookupPromises);
    const lookupResults = await Promise.all(lookups.map(r => r.json()));

    const signals: any = {};
    lookupResults.forEach((data, idx) => {
      if (data.entities?.length) {
        const id = data.entities[0].id;
        if (idx === 0) signals["signal.interests.entities"] = [ id ];
        // extend for others if multiple types
      }
    });

    const filterTypes = Object.keys(signals).length ? ["urn:entity:artist"] : []; // adjust per type

    // Build insights URL and query string
    const params = new URLSearchParams();
    if (filterTypes.length) params.set("filter.type", filterTypes[0]);
    Object.entries(signals).forEach(([key, val]) => {
      params.set(key, JSON.stringify(val));
    });
    params.set("take", "3");

    const insightsRes = await fetch(`${QLOO_BASE}/insights?${params.toString()}`, {
      method: "GET",
      headers: {
        "X-Api-Key": Deno.env.get("QLOO_API_KEY")!,
      },
    });

    let aiResponse = `Sorry, I couldn’t find personalized recommendations.`;

    let recs = [];
    if (insightsRes.ok) {
      const d = await insightsRes.json();
      if (d.results?.length) {
        aiResponse = `Based on your taste, here are some tailored suggestions for "${message}".`;
        recs = d.results.map((item: any) => ({
          title: item.name || item.title,
          category: item.type?.split(":").pop(),
          description: item.description ?? "",
          confidence: item.affinity_score ?? 0
        }));
      }
    }

    if (!recs.length) {
      recs = [{
        title: "Personalized Recommendation",
        category: "Suggestion",
        description: "Based on your taste profile",
        confidence: 0.8
      }];
    }

    return new Response(
      JSON.stringify({ response: aiResponse, recommendations: recs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
