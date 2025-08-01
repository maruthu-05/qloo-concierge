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
    console.log('Received user preferences:', preferences);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Gemini API Key is not set.');

    const categories = Object.entries(preferences)
      .map(([category, items]) => `${category}: ${items.join(', ')}`)
      .join('\n');

    const prompt = `
I am building a personalized recommendation assistant.
Based on the user's preferences in various categories, suggest one top recommendation per category with:
- Title
- Category
- A short description (why it is recommended)
- A confidence score (0-1 scale)

User preferences:
${categories}

Return JSON array of recommendations like:
[
  {
    "title": "...",
    "category": "...",
    "description": "...",
    "confidence": ...
  },
  ...
]
`;

    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      throw new Error(`Gemini API error: ${geminiRes.status} ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    const modelReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let recommendations = [];
    try {
      recommendations = JSON.parse(modelReply);
    } catch (e) {
      console.warn("Gemini response parsing failed, sending default recommendation.");
      recommendations = [{
        title: "Curated Pick",
        category: "General",
        description: "Based on your profile",
        confidence: 0.85
      }];
    }

    const welcome = `Great! I now understand your tastes in ${Object.keys(preferences).join(', ')}. Let's explore personalized recommendations based on your preferences.`;

    return new Response(JSON.stringify({
      message: welcome,
      recommendations
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
