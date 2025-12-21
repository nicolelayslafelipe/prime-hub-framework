import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  distance: number;
  fee: number;
  breakdown: {
    baseFee: number;
    extraDistance: number;
    extraFee: number;
  };
}

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
  const distance = R * c;
  
  return Math.round(distance * 100) / 100;
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
  if (distance <= minDistanceIncluded) {
    return {
      fee: baseFee,
      extraDistance: 0,
      extraFee: 0,
    };
  }
  
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

    const distance = calculateHaversineDistance(
      establishmentLatitude,
      establishmentLongitude,
      customerLatitude,
      customerLongitude
    );

    const { fee, extraDistance, extraFee } = calculateDeliveryFee(
      distance,
      baseFee || 5,
      pricePerKm || 2,
      minDistanceIncluded || 2
    );

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
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
