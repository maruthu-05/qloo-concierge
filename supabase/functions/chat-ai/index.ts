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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, preferences } = await req.json();
    
    console.log('Received chat request:', { message, preferences });

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are Vibora, an AI taste assistant that provides personalized lifestyle recommendations. 
        ${preferences ? `User preferences: ${JSON.stringify(preferences)}` : ''}
        
        Guidelines:
        - Provide conversational, friendly responses
        - Focus on taste-based recommendations across music, food, movies, travel, fashion
        - Always suggest 2-3 specific recommendations with confidence scores
        - Keep responses concise but helpful
        - Match the user's interests and preferences`
      },
      {
        role: 'user',
        content: message
      }
    ];

    // Call Qloo API for taste-based insights
    const queueResponse = await fetch(`https://staging.api.qloo.com/v2/insights?query=${encodeURIComponent(message)}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': "api key",
        'Content-Type': 'application/json',
      },
    });

    let aiResponse = `Based on your taste profile, here are some recommendations for "${message}".`;
    
    if (queueResponse.ok) {
      const queueData = await queueResponse.json();
      if (queueData.results && queueData.results.length > 0) {
        aiResponse = `Great question! Based on your taste preferences, I've found some interesting insights about "${message}". Let me share what I discovered.`;
      }
    }

    // Generate recommendations based on the conversation
    const recommendations = await generateRecommendations(message, preferences);

    return new Response(
      JSON.stringify({
        response: aiResponse,
        recommendations
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateRecommendations(message: string, preferences?: any) {
  try {
    // Map preferences to Qloo entity types
    const entityTypes = [];
    if (preferences?.music) entityTypes.push('urn:entity:artist');
    if (preferences?.movies) entityTypes.push('urn:entity:movie');
    if (preferences?.food) entityTypes.push('urn:entity:place');
    if (preferences?.travel) entityTypes.push('urn:entity:destination');
    if (preferences?.fashion) entityTypes.push('urn:entity:brand');

    const recommendations = [];
    
    // Get recommendations for each relevant entity type
    for (const entityType of entityTypes.slice(0, 2)) { // Limit to avoid too many API calls
      const response = await fetch(`https://staging.api.qloo.com/v2/insights?filter.type=${entityType}&query=${encodeURIComponent(message)}`, {
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
            title: item.name || item.title || "Recommendation",
            category: entityType.split(':').pop() || "suggestion",
            description: item.description || `Recommended based on your ${Object.keys(preferences || {})[0]} preferences`,
            confidence: item.affinity_score || 0.85
          });
        }
      }
    }

    if (recommendations.length === 0) {
      return [{
        title: "Personalized Recommendation",
        category: "Suggestion",
        description: "Based on your unique taste profile",
        confidence: 0.9
      }];
    }

    return recommendations;

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [{
      title: "Curated Selection",
      category: "Recommendation", 
      description: "Based on your preferences",
      confidence: 0.8
    }];
  }
}