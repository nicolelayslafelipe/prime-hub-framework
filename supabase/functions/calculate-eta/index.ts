import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ETARequest {
  customerLatitude: number;
  customerLongitude: number;
  establishmentLatitude: number;
  establishmentLongitude: number;
  averagePrepTime: number;
  peakTimeAdjustment?: number;
}

interface ETAResponse {
  success: boolean;
  eta: {
    prepTime: number;
    travelTime: number;
    totalMin: number;
    totalMax: number;
    distance: number;
  };
  displayText: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ETARequest = await req.json();
    
    const {
      customerLatitude,
      customerLongitude,
      establishmentLatitude,
      establishmentLongitude,
      averagePrepTime,
      peakTimeAdjustment = 0,
    } = body;

    if (
      customerLatitude === undefined ||
      customerLongitude === undefined ||
      establishmentLatitude === undefined ||
      establishmentLongitude === undefined
    ) {
      return new Response(
        JSON.stringify({ success: false, error: "Coordenadas inválidas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    if (!MAPBOX_TOKEN) {
      const distance = calculateHaversineDistance(
        establishmentLatitude,
        establishmentLongitude,
        customerLatitude,
        customerLongitude
      );
      
      const estimatedTravelTime = Math.ceil((distance / 30) * 60);
      const prepTime = averagePrepTime + peakTimeAdjustment;
      const totalMin = prepTime + estimatedTravelTime;
      const totalMax = totalMin + 10;
      
      return new Response(
        JSON.stringify({
          success: true,
          eta: {
            prepTime,
            travelTime: estimatedTravelTime,
            totalMin,
            totalMax,
            distance: Math.round(distance * 10) / 10,
          },
          displayText: `${totalMin}-${totalMax} min`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${establishmentLongitude},${establishmentLatitude};${customerLongitude},${customerLatitude}?access_token=${MAPBOX_TOKEN}&overview=false`;
    
    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (!directionsResponse.ok || !directionsData.routes || directionsData.routes.length === 0) {
      const distance = calculateHaversineDistance(
        establishmentLatitude,
        establishmentLongitude,
        customerLatitude,
        customerLongitude
      );
      
      const estimatedTravelTime = Math.ceil((distance / 30) * 60);
      const prepTime = averagePrepTime + peakTimeAdjustment;
      const totalMin = prepTime + estimatedTravelTime;
      const totalMax = totalMin + 10;
      
      return new Response(
        JSON.stringify({
          success: true,
          eta: {
            prepTime,
            travelTime: estimatedTravelTime,
            totalMin,
            totalMax,
            distance: Math.round(distance * 10) / 10,
          },
          displayText: `${totalMin}-${totalMax} min`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = directionsData.routes[0];
    const travelTimeSeconds = route.duration;
    const distanceMeters = route.distance;
    
    const travelTimeMinutes = Math.ceil(travelTimeSeconds / 60);
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    
    const prepTime = averagePrepTime + peakTimeAdjustment;
    const totalMin = prepTime + travelTimeMinutes;
    const totalMax = totalMin + 10;

    const response: ETAResponse = {
      success: true,
      eta: {
        prepTime,
        travelTime: travelTimeMinutes,
        totalMin,
        totalMax,
        distance: distanceKm,
      },
      displayText: `${totalMin}-${totalMax} min`,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calculating ETA:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
