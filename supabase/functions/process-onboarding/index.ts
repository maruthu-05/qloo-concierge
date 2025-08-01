import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    console.log("Received user preferences:", preferences);

    const categories = Object.entries(preferences)
      .map(([category, entities]) => `${category}: ${entities.join(", ")}`)
      .join("\n");

    const prompt = `
Based on the following user preferences, generate 5 personalized recommendations. Include title, category, description, and a confidence score (0.5–1.0):

${categories}

Format as JSON array like:
[
  {
    "title": "Example",
    "category": "music",
    "description": "Because you like XYZ",
    "confidence": 0.91
  },
  ...
]
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4", // or "gpt-3.5-turbo"
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API failed: ${errText}`);
    }

    const json = await response.json();
    const reply = json.choices[0].message.content.trim();

    let recommendations = [];
    try {
      recommendations = JSON.parse(reply);
    } catch (e) {
      console.warn("Could not parse GPT response:", reply);
      recommendations = [{
        title: "Curated Pick",
        category: "General",
        description: "Based on your profile",
        confidence: 0.85
      }];
    }

    const welcome = `Awesome! I understand your preferences in ${Object.keys(preferences).join(", ")}. Here are some curated suggestions for you!`;

    return new Response(
      JSON.stringify({ message: welcome, recommendations }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
