import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentResult {
  // PIX
  payment_id?: number;
  status?: string;
  qr_code?: string;
  qr_code_base64?: string;
  expiration_date?: string;
  // Card
  preference_id?: string;
  checkout_url?: string;
  sandbox_checkout_url?: string;
}

interface CreatePaymentParams {
  orderId: string;
  paymentType: 'pix' | 'card';
  amount: number;
  customerEmail?: string;
  description?: string;
}

export function useMercadoPagoPayment() {
  const [isCreating, setIsCreating] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCallback(async ({
    orderId,
    paymentType,
    amount,
    customerEmail,
    description,
  }: CreatePaymentParams): Promise<PaymentResult | null> => {
    setIsCreating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-mercadopago-payment', {
        body: {
          order_id: orderId,
          payment_type: paymentType,
          amount,
          customer_email: customerEmail,
          description,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPaymentResult(data);
      return data;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar pagamento';
      setError(message);
      toast.error('Erro ao processar pagamento', { description: message });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const resetPayment = useCallback(() => {
    setPaymentResult(null);
    setError(null);
  }, []);

  return {
    createPayment,
    resetPayment,
    isCreating,
    paymentResult,
    error,
  };
}
