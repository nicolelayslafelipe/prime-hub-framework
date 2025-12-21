import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
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
      state = ctx.short_code?.replace('BR-', '') || ctx.text;
    } else if (ctx.id.startsWith('postcode')) {
      postcode = ctx.text;
    }
  }
  
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
    postcode: postcode.replace(/\D/g, ''),
    latitude: feature.center[1],
    longitude: feature.center[0],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado', results: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado', results: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    
    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: 'Busca muito curta', results: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geocodificação não configurada', results: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encodedQuery = encodeURIComponent(query);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&country=BR&language=pt&types=address,poi&limit=5`;
    
    const response = await fetch(mapboxUrl);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na busca', results: [] }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    const results: GeocodedAddress[] = (data.features || []).map(parseMapboxFeature);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[geocode-address] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno', results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
