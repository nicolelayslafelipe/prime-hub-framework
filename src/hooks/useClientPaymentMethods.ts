import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LucideIcon, Smartphone, Wallet, CreditCard, Banknote, UtensilsCrossed } from 'lucide-react';

export interface ClientPaymentMethod {
  id: string;
  dbId: string;
  label: string;
  icon: LucideIcon;
  description: string;
  isOnline?: boolean;
  type: string;
  maxChange?: number | null;
}

interface PaymentMethodDB {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  is_active: boolean;
  max_change: number | null;
  sort_order: number;
}

const getMethodConfig = (type: string, isOnline: boolean = false): { 
  icon: LucideIcon; 
  description: string;
  frontendId: string;
} => {
  switch (type) {
    case 'pix':
      return isOnline 
        ? { icon: Smartphone, description: 'Pague agora via PIX', frontendId: 'pix_online' }
        : { icon: Smartphone, description: 'Pague na entrega', frontendId: 'pix' };
    case 'credit':
      return isOnline
        ? { icon: Wallet, description: 'Pague agora com cartão', frontendId: 'card_online' }
        : { icon: CreditCard, description: 'Máquina na entrega', frontendId: 'credit' };
    case 'debit':
      return { icon: CreditCard, description: 'Máquina na entrega', frontendId: 'debit' };
    case 'cash':
      return { icon: Banknote, description: 'Pagamento na entrega', frontendId: 'cash' };
    case 'voucher':
      return { icon: UtensilsCrossed, description: 'Vale Refeição', frontendId: 'voucher' };
    default:
      return { icon: CreditCard, description: 'Forma de pagamento', frontendId: type };
  }
};

export function useClientPaymentMethods() {
  const [methods, setMethods] = useState<ClientPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveMethods = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (fetchError) throw fetchError;

      const mappedMethods: ClientPaymentMethod[] = [];
      
      (data || []).forEach((method: PaymentMethodDB) => {
        if (method.type === 'pix') {
          const onlineConfig = getMethodConfig('pix', true);
          mappedMethods.push({
            id: onlineConfig.frontendId,
            dbId: method.id,
            label: 'PIX Online',
            icon: onlineConfig.icon,
            description: onlineConfig.description,
            isOnline: true,
            type: method.type,
            maxChange: null,
          });
          
          const offlineConfig = getMethodConfig('pix', false);
          mappedMethods.push({
            id: offlineConfig.frontendId,
            dbId: method.id,
            label: 'PIX na Entrega',
            icon: offlineConfig.icon,
            description: offlineConfig.description,
            isOnline: false,
            type: method.type,
            maxChange: null,
          });
        } else if (method.type === 'credit') {
          const onlineConfig = getMethodConfig('credit', true);
          mappedMethods.push({
            id: onlineConfig.frontendId,
            dbId: method.id,
            label: 'Cartão Online',
            icon: onlineConfig.icon,
            description: onlineConfig.description,
            isOnline: true,
            type: method.type,
            maxChange: null,
          });
          
          const offlineConfig = getMethodConfig('credit', false);
          mappedMethods.push({
            id: offlineConfig.frontendId,
            dbId: method.id,
            label: 'Cartão de Crédito',
            icon: offlineConfig.icon,
            description: offlineConfig.description,
            isOnline: false,
            type: method.type,
            maxChange: null,
          });
        } else {
          const config = getMethodConfig(method.type);
          mappedMethods.push({
            id: config.frontendId,
            dbId: method.id,
            label: method.name,
            icon: config.icon,
            description: config.description,
            isOnline: false,
            type: method.type,
            maxChange: method.max_change,
          });
        }
      });

      setMethods(mappedMethods);
    } catch {
      setError('Erro ao carregar formas de pagamento');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveMethods();

    const channel = supabase
      .channel('client_payment_methods_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_methods',
        },
        () => {
          fetchActiveMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveMethods]);

  const isMethodActive = useCallback((methodId: string): boolean => {
    return methods.some(m => m.id === methodId);
  }, [methods]);

  const getMethodById = useCallback((methodId: string): ClientPaymentMethod | undefined => {
    return methods.find(m => m.id === methodId);
  }, [methods]);

  const getCashMaxChange = useCallback((): number | null => {
    const cashMethod = methods.find(m => m.type === 'cash');
    return cashMethod?.maxChange ?? null;
  }, [methods]);

  return {
    methods,
    isLoading,
    error,
    isMethodActive,
    getMethodById,
    getCashMaxChange,
    refetch: fetchActiveMethods,
  };
}
