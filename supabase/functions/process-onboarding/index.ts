import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    
    console.log('Processing onboarding preferences:', preferences);

    // Analyze preferences and generate initial recommendations
    const analysisMessages = [
      {
        role: 'system',
        content: `You are Vibora AI. Analyze user taste preferences and create a welcoming response with personalized recommendations.
        
        Create a response that:
        1. Acknowledges their specific tastes
        2. Shows understanding of their preferences
        3. Generates 2-3 highly relevant recommendations
        
        Response format: JSON with "message" and "recommendations" array.
        Recommendations format: [{"title": "Name", "category": "Type", "description": "Description", "confidence": 0.9}]`
      },
      {
        role: 'user',
        content: `User preferences: ${JSON.stringify(preferences)}`
      }
    ];

    // Get recommendations from Qloo based on preferences
    const recommendations = [];
    
    // Map preferences to Qloo entity types and get recommendations
    const preferenceMap = {
      music: 'urn:entity:artist',
      movies: 'urn:entity:movie', 
      food: 'urn:entity:place',
      travel: 'urn:entity:destination',
      fashion: 'urn:entity:brand'
    };

    for (const [category, entities] of Object.entries(preferences)) {
      if (entities.length > 0 && preferenceMap[category]) {
        const response = await fetch(`https://staging.api.qloo.com/v2/insights?filter.type=${preferenceMap[category]}&query=${encodeURIComponent(entities[0])}`, {
          method: 'GET',
          headers: {
            'X-Api-Key': "api key",
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const item = data.results[0];
            recommendations.push({
              title: item.name || item.title || `${category} recommendation`,
              category: category,
              description: `Perfect match for your ${entities.join(', ')} preferences`,
              confidence: item.affinity_score || 0.9
            });
          }
        }
      }
    }

    // Create welcome message based on preferences
    const welcomeMessage = `Perfect! I've learned about your tastes in ${Object.keys(preferences).join(', ')}. Based on your preferences, I can see you enjoy ${Object.entries(preferences).map(([key, values]) => `${values.join(' and ')} ${key}`).join(', ')}. Now I can give you personalized recommendations using Qloo's taste intelligence. What would you like to explore today?`;

    return new Response(
      JSON.stringify({
        message: welcomeMessage,
        recommendations: recommendations.length > 0 ? recommendations : [
          {
            title: "Curated Selection",
            category: "Recommendation",
            description: "Based on your unique taste profile",
            confidence: 0.9
          }
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-onboarding function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});