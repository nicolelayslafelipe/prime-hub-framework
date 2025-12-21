import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalculateFeeRequest {
  customerLatitude: number;
  customerLongitude: number;
  establishmentLatitude: number;
  establishmentLongitude: number;
  baseFee: number;
  pricePerKm: number;
  minDistanceIncluded: number;
}

interface CalculateFeeResponse {
  success: boolean;
  distance: number; // in km
  fee: number;
  breakdown: {
    baseFee: number;
    extraDistance: number;
    extraFee: number;
  };
}

// Haversine formula to calculate distance between two points
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateDeliveryFee(
  distance: number,
  baseFee: number,
  pricePerKm: number,
  minDistanceIncluded: number
): { fee: number; extraDistance: number; extraFee: number } {
  // If distance is within minimum, only charge base fee
  if (distance <= minDistanceIncluded) {
    return {
      fee: baseFee,
      extraDistance: 0,
      extraFee: 0,
    };
  }
  
  // Calculate extra distance and fee
  const extraDistance = distance - minDistanceIncluded;
  const extraFee = extraDistance * pricePerKm;
  const totalFee = baseFee + extraFee;
  
  return {
    fee: Math.round(totalFee * 100) / 100,
    extraDistance: Math.round(extraDistance * 100) / 100,
    extraFee: Math.round(extraFee * 100) / 100,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CalculateFeeRequest = await req.json();
    
    const {
      customerLatitude,
      customerLongitude,
      establishmentLatitude,
      establishmentLongitude,
      baseFee,
      pricePerKm,
      minDistanceIncluded,
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

    // Calculate distance using Haversine formula
    const distance = calculateHaversineDistance(
      establishmentLatitude,
      establishmentLongitude,
      customerLatitude,
      customerLongitude
    );

    // Calculate fee
    const { fee, extraDistance, extraFee } = calculateDeliveryFee(
      distance,
      baseFee || 5,
      pricePerKm || 2,
      minDistanceIncluded || 2
    );

    console.log(`Distance calculation: ${distance}km, Fee: R$${fee}`);

    const response: CalculateFeeResponse = {
      success: true,
      distance,
      fee,
      breakdown: {
        baseFee: baseFee || 5,
        extraDistance,
        extraFee,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
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
