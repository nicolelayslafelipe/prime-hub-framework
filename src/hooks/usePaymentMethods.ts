import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentMethodDB {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  is_active: boolean;
  max_change: number | null;
  sort_order: number;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Erro ao carregar formas de pagamento');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const toggleMethod = useCallback(async (id: string): Promise<boolean> => {
    const method = methods.find(m => m.id === id);
    if (!method) return false;

    const previousMethods = [...methods];
    setMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', id);

      if (error) throw error;

      toast.success(`${method.name} ${!method.is_active ? 'ativado' : 'desativado'}!`);
      return true;
    } catch (error) {
      console.error('Error toggling payment method:', error);
      setMethods(previousMethods);
      toast.error('Erro ao atualizar forma de pagamento');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [methods]);

  const updateMaxChange = useCallback(async (id: string, maxChange: number): Promise<boolean> => {
    const previousMethods = [...methods];
    setMethods(prev => prev.map(m => m.id === id ? { ...m, max_change: maxChange } : m));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ max_change: maxChange })
        .eq('id', id);

      if (error) throw error;

      toast.success('Troco máximo atualizado!');
      return true;
    } catch (error) {
      console.error('Error updating max change:', error);
      setMethods(previousMethods);
      toast.error('Erro ao atualizar troco máximo');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [methods]);

  return {
    methods,
    isLoading,
    isSaving,
    toggleMethod,
    updateMaxChange,
    refetch: fetchMethods
  };
}
