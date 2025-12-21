import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  address?: string;
  text?: string;
  properties?: {
    address?: string;
  };
}

interface GeocodedAddress {
  placeId: string;
  placeName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

function parseMapboxFeature(feature: MapboxFeature): GeocodedAddress {
  const context = feature.context || [];
  
  // Extract components from context
  let neighborhood = '';
  let city = '';
  let state = '';
  let postcode = '';
  
  for (const ctx of context) {
    if (ctx.id.startsWith('neighborhood')) {
      neighborhood = ctx.text;
    } else if (ctx.id.startsWith('locality')) {
      if (!neighborhood) neighborhood = ctx.text;
    } else if (ctx.id.startsWith('place')) {
      city = ctx.text;
    } else if (ctx.id.startsWith('region')) {
      // Use short_code if available (e.g., "BR-SP" -> "SP")
      state = ctx.short_code?.replace('BR-', '') || ctx.text;
    } else if (ctx.id.startsWith('postcode')) {
      postcode = ctx.text;
    }
  }
  
  // Extract street name and number
  const street = feature.text || '';
  const number = feature.address || feature.properties?.address || '';
  
  return {
    placeId: feature.id,
    placeName: feature.place_name,
    street,
    number,
    neighborhood,
    city,
    state,
    postcode: postcode.replace(/\D/g, ''), // Clean postcode
    latitude: feature.center[1],
    longitude: feature.center[0],
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    
    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Query must be at least 3 characters',
          results: [] 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    
    if (!mapboxToken) {
      console.error('[geocode-address] MAPBOX_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Mapbox token not configured',
          results: [] 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[geocode-address] Searching for:', query);

    // Call Mapbox Geocoding API
    const encodedQuery = encodeURIComponent(query);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&country=BR&language=pt&types=address,poi&limit=5`;
    
    const response = await fetch(mapboxUrl);
    
    if (!response.ok) {
      console.error('[geocode-address] Mapbox API error:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch from Mapbox',
          results: [] 
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    
    console.log('[geocode-address] Found', data.features?.length || 0, 'results');
    
    const results: GeocodedAddress[] = (data.features || []).map(parseMapboxFeature);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[geocode-address] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        results: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
