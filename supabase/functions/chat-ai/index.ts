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

    const systemPrompt = `You are Vibora, an AI assistant that provides personalized taste-based lifestyle recommendations like food, fashion, movies, or music. The user's preferences are: ${JSON.stringify(preferences)}. Respond in a helpful and friendly manner.`;

    const recommendations = await generateRecommendationsWithLLM(systemPrompt, message);

    return new Response(
      JSON.stringify({
        response: "Here are some personalized recommendations for you:",
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

// Use OpenAI instead of Qloo
async function generateRecommendationsWithLLM(systemPrompt: string, userMessage: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',  // You can change to 'gpt-3.5-turbo' if needed
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8
    }),
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData?.error?.message || 'OpenAI API call failed');
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  return [{
    title: 'LLM Recommendation',
    category: 'General',
    description: content?.trim() || 'Based on your input and preferences.',
    confidence: 0.9
  }];
}
