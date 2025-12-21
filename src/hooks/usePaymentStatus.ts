import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';

interface PaymentData {
  payment_status: PaymentStatus | null;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  mp_qr_code: string | null;
  mp_checkout_url: string | null;
}

export function usePaymentStatus(orderId: string | null) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status, mp_payment_id, mp_preference_id, mp_qr_code, mp_checkout_url')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      
      setPaymentData(data as PaymentData);
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchPaymentStatus();
  }, [fetchPaymentStatus]);

  // Real-time subscription for payment status updates
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`payment-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('Payment status updated:', payload.new);
          const newData = payload.new as Record<string, unknown>;
          setPaymentData({
            payment_status: (newData.payment_status as PaymentStatus) || null,
            mp_payment_id: (newData.mp_payment_id as string) || null,
            mp_preference_id: (newData.mp_preference_id as string) || null,
            mp_qr_code: (newData.mp_qr_code as string) || null,
            mp_checkout_url: (newData.mp_checkout_url as string) || null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return {
    paymentData,
    isLoading,
    refetch: fetchPaymentStatus,
    isApproved: paymentData?.payment_status === 'approved',
    isPending: paymentData?.payment_status === 'pending',
    isRejected: paymentData?.payment_status === 'rejected',
  };
}
