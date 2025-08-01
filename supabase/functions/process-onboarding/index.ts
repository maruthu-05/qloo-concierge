import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    console.log('Processing onboarding preferences:', preferences);

    const recommendations = [];
    const entityMap = {
      music: 'artist',
      movies: 'movie',
      food: 'place',
      travel: 'destination',
      fashion: 'brand'
    };

    const apiKey = Deno.env.get('QLOO_API_KEY');

    for (const [category, entities] of Object.entries(preferences)) {
      if (!entities.length || !entityMap[category]) continue;

      const type = entityMap[category];

      const searchRes = await fetch(`https://hackathon.api.qloo.com/v2/search?query=${encodeURIComponent(entities[0])}&types=${type}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const entity = searchData.results?.[0];
      if (!entity?.id) continue;

      const insightsRes = await fetch(`https://hackathon.api.qloo.com/v2/insights?signal.interests.entities=${entity.id}&filter.type=urn:entity:${type}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (!insightsRes.ok) continue;
      const insightsData = await insightsRes.json();

      const top = insightsData.results?.[0];
      if (top) {
        recommendations.push({
          title: top.name || top.title || `${category} recommendation`,
          category: category,
          description: `Because you like ${entities[0]}`,
          confidence: top.affinity_score || 0.9
        });
      }
    }

    const welcome = `Great! I now understand your tastes in ${Object.keys(preferences).join(', ')}. Let's explore personalized recommendations based on your preferences.`;

    return new Response(
      JSON.stringify({
        message: welcome,
        recommendations: recommendations.length ? recommendations : [{
          title: "Curated Pick",
          category: "General",
          description: "Based on your profile",
          confidence: 0.85
        }]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in onboarding handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
