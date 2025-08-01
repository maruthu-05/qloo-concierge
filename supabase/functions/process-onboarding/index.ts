import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QLOO_API = "https://hackathon.api.qloo.com/v2";

const preferenceMap: Record<string, string> = {
  music: "artist",
  movies: "movie",
  food: "place",
  travel: "destination",
  fashion: "brand"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    console.log("Processing onboarding preferences:", preferences);

    const recommendations = [];

    for (const [category, values] of Object.entries(preferences)) {
      const type = preferenceMap[category];
      if (!type || values.length === 0) continue;

      const query = encodeURIComponent(values[0]);
      const searchRes = await fetch(`${QLOO_API}/search?query=${query}&types=${type}`, {
        headers: { "X-Api-Key": Deno.env.get("QLOO_API_KEY")! }
      });

      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const entity = searchData.entities?.[0];

      if (!entity) continue;

      const insightsParams = new URLSearchParams({
        "signal.interests.entities": JSON.stringify([entity.id]),
        "filter.type": `urn:entity:${type}`,
        "take": "1"
      });

      const insightsRes = await fetch(`${QLOO_API}/insights?${insightsParams}`, {
        headers: { "X-Api-Key": Deno.env.get("QLOO_API_KEY")! }
      });

      if (!insightsRes.ok) continue;

      const insightsData = await insightsRes.json();
      const result = insightsData.results?.[0];

      if (result) {
        recommendations.push({
          title: result.name || result.title || `${category} pick`,
          category: category,
          description: `Based on your love for ${values.join(', ')}`,
          confidence: result.affinity_score ?? 0.85
        });
      }
    }

    const welcomeMessage = `Awesome! Based on your preferences in ${Object.keys(preferences).join(', ')}, I see you enjoy ${Object.entries(preferences).map(([k, v]) => `${v.join(' & ')} (${k})`).join(', ')}. Let's discover something amazing together!`;

    return new Response(
      JSON.stringify({
        message: welcomeMessage,
        recommendations: recommendations.length > 0 ? recommendations : [{
          title: "Curated Discovery",
          category: "General",
          description: "Based on your unique taste profile",
          confidence: 0.9
        }]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in onboarding function:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
