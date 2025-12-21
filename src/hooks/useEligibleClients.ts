import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EligibleClient {
  user_id: string;
  push_notifications: boolean;
  promo_notifications: boolean;
}

export function useEligibleClients() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get clients who accept promotional notifications
  const getPromoEligibleClients = useCallback(async (): Promise<EligibleClient[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('client_preferences')
        .select('user_id, push_notifications, promo_notifications')
        .eq('promo_notifications', true);

      if (fetchError) throw fetchError;

      return (data || []) as EligibleClient[];
    } catch (err) {
      console.error('Error fetching eligible clients:', err);
      setError('Erro ao buscar clientes elegíveis');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get clients who have push notifications enabled
  const getPushEligibleClients = useCallback(async (): Promise<EligibleClient[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('client_preferences')
        .select('user_id, push_notifications, promo_notifications')
        .eq('push_notifications', true);

      if (fetchError) throw fetchError;

      return (data || []) as EligibleClient[];
    } catch (err) {
      console.error('Error fetching push eligible clients:', err);
      setError('Erro ao buscar clientes elegíveis');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get count of promo-eligible clients
  const getPromoEligibleCount = useCallback(async (): Promise<number> => {
    try {
      const { count, error: fetchError } = await supabase
        .from('client_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('promo_notifications', true);

      if (fetchError) throw fetchError;

      return count || 0;
    } catch (err) {
      console.error('Error fetching eligible count:', err);
      return 0;
    }
  }, []);

  return {
    isLoading,
    error,
    getPromoEligibleClients,
    getPushEligibleClients,
    getPromoEligibleCount,
  };
}
