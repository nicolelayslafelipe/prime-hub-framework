import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return new Response('OK', { status: 200 });
    }

    // Parse webhook notification
    const body = await req.json();

    // Handle different notification types
    if (body.type === 'payment' || body.action === 'payment.updated' || body.action === 'payment.created') {
      const paymentId = body.data?.id || body.id;
      
      if (!paymentId) {
        return new Response('OK', { status: 200 });
      }

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        return new Response('OK', { status: 200 });
      }

      const payment = await paymentResponse.json();

      const orderId = payment.external_reference;
      
      if (!orderId) {
        return new Response('OK', { status: 200 });
      }

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Map Mercado Pago status to our payment_status
      let paymentStatus: string;
      let orderStatus: string | null = null;

      switch (payment.status) {
        case 'approved':
          paymentStatus = 'approved';
          orderStatus = 'confirmed';
          break;
        case 'pending':
        case 'in_process':
          paymentStatus = 'pending';
          break;
        case 'rejected':
          paymentStatus = 'rejected';
          break;
        case 'cancelled':
          paymentStatus = 'cancelled';
          break;
        case 'refunded':
          paymentStatus = 'refunded';
          break;
        default:
          paymentStatus = payment.status;
      }

      const updateData: Record<string, string> = {
        payment_status: paymentStatus,
        mp_payment_id: String(payment.id),
      };

      if (orderStatus) {
        updateData.status = orderStatus;
      }

      await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

    } else if (body.type === 'merchant_order') {
      const merchantOrderId = body.data?.id;
      
      if (merchantOrderId) {
        const moResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (moResponse.ok) {
          const merchantOrder = await moResponse.json();
          
          if (merchantOrder.payments && merchantOrder.payments.length > 0) {
            const approvedPayment = merchantOrder.payments.find((p: { status: string }) => p.status === 'approved');
            
            if (approvedPayment && merchantOrder.external_reference) {
              const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
              const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
              const supabase = createClient(supabaseUrl, supabaseServiceKey);

              await supabase
                .from('orders')
                .update({
                  payment_status: 'approved',
                  status: 'confirmed',
                  mp_payment_id: String(approvedPayment.id),
                })
                .eq('id', merchantOrder.external_reference);
            }
          }
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});
