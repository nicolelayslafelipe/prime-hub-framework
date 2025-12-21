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

// Mapeamento de tipos do banco para configurações do frontend
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

      // Mapear métodos do banco para o formato do frontend
      const mappedMethods: ClientPaymentMethod[] = [];
      
      (data || []).forEach((method: PaymentMethodDB) => {
        // Para PIX e Cartão, criar versões online e offline se aplicável
        if (method.type === 'pix') {
          // PIX Online (pagamento antecipado)
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
          
          // PIX na entrega
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
          // Cartão Online
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
          
          // Cartão na entrega
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
          // Outros métodos (débito, dinheiro, voucher)
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
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError('Erro ao carregar formas de pagamento');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveMethods();

    // Realtime subscription para mudanças
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
          console.log('Payment methods changed, refetching...');
          fetchActiveMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveMethods]);

  // Verificar se um método específico está ativo
  const isMethodActive = useCallback((methodId: string): boolean => {
    return methods.some(m => m.id === methodId);
  }, [methods]);

  // Obter método pelo ID
  const getMethodById = useCallback((methodId: string): ClientPaymentMethod | undefined => {
    return methods.find(m => m.id === methodId);
  }, [methods]);

  // Obter max change para dinheiro
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
