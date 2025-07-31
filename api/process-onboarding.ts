import type { NextApiRequest, NextApiResponse } from 'next';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const { preferences } = req.body;
    
    console.log('Processing onboarding with preferences:', preferences);

    const preferenceMap: Record<string, string> = {
      music: 'urn:entity:artist',
      movies: 'urn:entity:movie',
      food: 'urn:entity:place',
      travel: 'urn:entity:destination',
      fashion: 'urn:entity:brand'
    };

    const recommendations = [];
    let welcomeMessage = "Welcome to Vibora! I've analyzed your preferences and found some exciting recommendations for you.";

    // Process each preference category
    for (const [category, entities] of Object.entries(preferences)) {
      if (entities && Array.isArray(entities) && entities.length > 0) {
        try {
          // Use the first entity to get related recommendations
          const response = await fetch(`https://staging.api.qloo.com/v2/insights?filter.type=${preferenceMap[category]}&query=${encodeURIComponent(entities[0])}`, {
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
                title: item.name || item.title || `${category} recommendation`,
                category: category,
                description: item.description || `Based on your love for ${entities.join(', ')}`,
                confidence: item.affinity_score || 0.85
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching recommendations for ${category}:`, error);
        }
      }
    }

    // If no recommendations were found, provide defaults
    if (recommendations.length === 0) {
      recommendations.push({
        title: "Personalized Discovery",
        category: "General",
        description: "Based on your unique taste profile, we'll curate amazing discoveries for you",
        confidence: 0.9
      });
    }

    return res.status(200).json({
      welcomeMessage,
      recommendations
    });

  } catch (error: any) {
    console.error('Error in process-onboarding function:', error);
    return res.status(500).json({ error: error.message });
  }
}