import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ETARequest {
  customerLatitude: number;
  customerLongitude: number;
  establishmentLatitude: number;
  establishmentLongitude: number;
  averagePrepTime: number; // in minutes
  peakTimeAdjustment?: number; // optional extra time during peak hours
}

interface ETAResponse {
  success: boolean;
  eta: {
    prepTime: number; // minutes
    travelTime: number; // minutes
    totalMin: number; // minimum total time
    totalMax: number; // maximum total time (with buffer)
    distance: number; // km
  };
  displayText: string; // e.g., "35-45 min"
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ETARequest = await req.json();
    
    const {
      customerLatitude,
      customerLongitude,
      establishmentLatitude,
      establishmentLongitude,
      averagePrepTime,
      peakTimeAdjustment = 0,
    } = body;

    // Validate required fields
    if (
      customerLatitude === undefined ||
      customerLongitude === undefined ||
      establishmentLatitude === undefined ||
      establishmentLongitude === undefined
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required coordinates",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
    if (!MAPBOX_TOKEN) {
      // Fallback: estimate based on distance (average 30km/h in city traffic)
      const distance = calculateHaversineDistance(
        establishmentLatitude,
        establishmentLongitude,
        customerLatitude,
        customerLongitude
      );
      
      const estimatedTravelTime = Math.ceil((distance / 30) * 60); // 30km/h average
      const prepTime = averagePrepTime + peakTimeAdjustment;
      const totalMin = prepTime + estimatedTravelTime;
      const totalMax = totalMin + 10; // 10 min buffer
      
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
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use Mapbox Directions API for accurate travel time
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${establishmentLongitude},${establishmentLatitude};${customerLongitude},${customerLatitude}?access_token=${MAPBOX_TOKEN}&overview=false`;
    
    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (!directionsResponse.ok || !directionsData.routes || directionsData.routes.length === 0) {
      console.error("Mapbox Directions API error:", directionsData);
      
      // Fallback to distance-based estimation
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
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const route = directionsData.routes[0];
    const travelTimeSeconds = route.duration; // in seconds
    const distanceMeters = route.distance; // in meters
    
    const travelTimeMinutes = Math.ceil(travelTimeSeconds / 60);
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    
    const prepTime = averagePrepTime + peakTimeAdjustment;
    const totalMin = prepTime + travelTimeMinutes;
    const totalMax = totalMin + 10; // 10 min buffer for variability

    console.log(`ETA calculation: prep=${prepTime}min, travel=${travelTimeMinutes}min, total=${totalMin}-${totalMax}min`);

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
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Haversine formula for fallback
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
