import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, preferences } = await req.json();
    console.log('Received chat request:', { message, preferences });

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are Vibora, an AI assistant giving taste-based lifestyle recommendations. User preferences: ${JSON.stringify(preferences)}.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    // Generate recommendations
    const recommendations = await generateRecommendations(message, preferences);

    const responseText = recommendations.length
      ? `Great! Based on your taste profile, here are some recommendations for "${message}":`
      : `Sorry, I couldn't find any recommendations for "${message}" based on your preferences.`;

    return new Response(
      JSON.stringify({
        response: responseText,
        recommendations
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateRecommendations(message: string, preferences?: any) {
  const entityMap = {
    music: 'artist',
    movies: 'movie',
    food: 'place',
    travel: 'destination',
    fashion: 'brand'
  };

  const apiKey = Deno.env.get('QLOO_API_KEY');
  const recommendations = [];

  for (const [prefKey, values] of Object.entries(preferences || {})) {
    const type = entityMap[prefKey];
    if (!type || !values?.length) continue;

    // Search for Qloo entity ID
    const searchRes = await fetch(`https://hackathon.api.qloo.com/v2/search?query=${encodeURIComponent(values[0])}&types=${type}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!searchRes.ok) continue;
    const searchData = await searchRes.json();
    const entity = searchData.results?.[0];
    if (!entity?.id) continue;

    // Get recommendations via insights API
    const insightRes = await fetch(`https://hackathon.api.qloo.com/v2/insights?signal.interests.entities=${entity.id}&filter.type=urn:entity:${type}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!insightRes.ok) continue;
    const insightData = await insightRes.json();

    const top = insightData.results?.[0];
    if (top) {
      recommendations.push({
        title: top.name || top.title || 'Recommendation',
        category: prefKey,
        description: `Because you like ${values[0]}`,
        confidence: top.affinity_score || 0.9
      });
    }
  }

  return recommendations.length ? recommendations : [{
    title: 'Curated Suggestion',
    category: 'General',
    description: 'Based on your profile',
    confidence: 0.8
  }];
}
