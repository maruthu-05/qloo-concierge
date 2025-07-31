import type { NextApiRequest, NextApiResponse } from 'next';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, preferences } = req.body;
    
    console.log('Received chat request:', { message, preferences });

    // Call Qloo API for taste-based insights
    const queueResponse = await fetch(`https://staging.api.qloo.com/v2/insights?query=${encodeURIComponent(message)}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.QLOO_API_KEY!,
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

    return res.status(200).json({
      response: aiResponse,
      recommendations
    });

  } catch (error: any) {
    console.error('Error in chat-ai function:', error);
    return res.status(500).json({ error: error.message });
  }
}

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
          'X-Api-Key': process.env.QLOO_API_KEY!,
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