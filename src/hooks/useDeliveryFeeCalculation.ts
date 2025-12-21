import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DistanceFeeConfig {
  enabled: boolean;
  baseFee: number;
  pricePerKm: number;
  minDistanceIncluded: number;
  establishmentLatitude: number | null;
  establishmentLongitude: number | null;
}

interface FeeCalculationResult {
  success: boolean;
  distance: number;
  fee: number;
  breakdown: {
    baseFee: number;
    extraDistance: number;
    extraFee: number;
  };
}

interface UseDeliveryFeeCalculationReturn {
  calculateFee: (
    customerLat: number,
    customerLng: number,
    config: DistanceFeeConfig
  ) => Promise<FeeCalculationResult | null>;
  isCalculating: boolean;
  lastResult: FeeCalculationResult | null;
  error: string | null;
}

export function useDeliveryFeeCalculation(): UseDeliveryFeeCalculationReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<FeeCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateFee = useCallback(
    async (
      customerLat: number,
      customerLng: number,
      config: DistanceFeeConfig
    ): Promise<FeeCalculationResult | null> => {
      // If distance-based fee is disabled or no establishment coordinates, return null
      if (!config.enabled || !config.establishmentLatitude || !config.establishmentLongitude) {
        setLastResult(null);
        return null;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('calculate-delivery-fee', {
          body: {
            customerLatitude: customerLat,
            customerLongitude: customerLng,
            establishmentLatitude: config.establishmentLatitude,
            establishmentLongitude: config.establishmentLongitude,
            baseFee: config.baseFee,
            pricePerKm: config.pricePerKm,
            minDistanceIncluded: config.minDistanceIncluded,
          },
        });

        if (fnError) {
          throw fnError;
        }

        if (data && data.success) {
          const result: FeeCalculationResult = {
            success: true,
            distance: data.distance,
            fee: data.fee,
            breakdown: data.breakdown,
          };
          setLastResult(result);
          return result;
        } else {
          throw new Error(data?.error || 'Failed to calculate fee');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular taxa';
        setError(errorMessage);
        console.error('Error calculating delivery fee:', err);
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  return {
    calculateFee,
    isCalculating,
    lastResult,
    error,
  };
}
