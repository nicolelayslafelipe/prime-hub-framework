import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ETAConfig {
  establishmentLatitude: number | null;
  establishmentLongitude: number | null;
  averagePrepTime: number;
  peakTimeAdjustment?: number;
}

interface ETAResult {
  prepTime: number;
  travelTime: number;
  totalMin: number;
  totalMax: number;
  distance: number;
  displayText: string;
}

interface UseETACalculationReturn {
  calculateETA: (
    customerLat: number,
    customerLng: number,
    config: ETAConfig
  ) => Promise<ETAResult | null>;
  isCalculating: boolean;
  lastResult: ETAResult | null;
  error: string | null;
}

export function useETACalculation(): UseETACalculationReturn {
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<ETAResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateETA = useCallback(
    async (
      customerLat: number,
      customerLng: number,
      config: ETAConfig
    ): Promise<ETAResult | null> => {
      if (!config.establishmentLatitude || !config.establishmentLongitude) {
        // Fallback to simple estimation
        const totalMin = config.averagePrepTime + 20; // assume 20 min travel
        const totalMax = totalMin + 10;
        const result: ETAResult = {
          prepTime: config.averagePrepTime,
          travelTime: 20,
          totalMin,
          totalMax,
          distance: 0,
          displayText: `${totalMin}-${totalMax} min`,
        };
        setLastResult(result);
        return result;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('calculate-eta', {
          body: {
            customerLatitude: customerLat,
            customerLongitude: customerLng,
            establishmentLatitude: config.establishmentLatitude,
            establishmentLongitude: config.establishmentLongitude,
            averagePrepTime: config.averagePrepTime,
            peakTimeAdjustment: config.peakTimeAdjustment || 0,
          },
        });

        if (fnError) {
          throw fnError;
        }

        if (data && data.success) {
          const result: ETAResult = {
            prepTime: data.eta.prepTime,
            travelTime: data.eta.travelTime,
            totalMin: data.eta.totalMin,
            totalMax: data.eta.totalMax,
            distance: data.eta.distance,
            displayText: data.displayText,
          };
          setLastResult(result);
          return result;
        } else {
          throw new Error(data?.error || 'Failed to calculate ETA');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular tempo';
        setError(errorMessage);
        console.error('Error calculating ETA:', err);
        
        // Fallback estimation
        const totalMin = config.averagePrepTime + 20;
        const totalMax = totalMin + 10;
        const result: ETAResult = {
          prepTime: config.averagePrepTime,
          travelTime: 20,
          totalMin,
          totalMax,
          distance: 0,
          displayText: `${totalMin}-${totalMax} min`,
        };
        setLastResult(result);
        return result;
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  return {
    calculateETA,
    isCalculating,
    lastResult,
    error,
  };
}
