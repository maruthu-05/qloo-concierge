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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${"api key"}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: analysisMessages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(aiResponse);
      return new Response(
        JSON.stringify(parsed),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch {
      // Fallback if JSON parsing fails
      return new Response(
        JSON.stringify({
          message: `Perfect! I've learned about your tastes in ${Object.keys(preferences).join(', ')}. Now I can give you personalized recommendations. What would you like to explore today?`,
          recommendations: [
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
    }

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