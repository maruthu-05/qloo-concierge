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

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${"api key"}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const aiResponse = openAIData.choices[0].message.content;

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
    // For now, use OpenAI to generate recommendations
    // Later this can be replaced with Qloo API
    const recMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `Generate 2-3 specific recommendations in JSON format based on user preferences and message.
        Format: [{"title": "Name", "category": "Type", "description": "Brief description", "confidence": 0.85}]
        Categories: Restaurant, Music, Film, Book, Travel, Fashion, Event
        Make recommendations realistic and specific.`
      },
      {
        role: 'user',
        content: `User message: "${message}" 
        ${preferences ? `Preferences: ${JSON.stringify(preferences)}` : ''}`
      }
    ];

    const recResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${"api key"}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: recMessages,
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (recResponse.ok) {
      const recData = await recResponse.json();
      const recText = recData.choices[0].message.content;
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(recText);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Fallback recommendations if parsing fails
        return [
          {
            title: "Personalized Suggestion",
            category: "Recommendation",
            description: "Based on your interests, I'd love to suggest something perfect for you",
            confidence: 0.85
          }
        ];
      }
    }

    return [];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}