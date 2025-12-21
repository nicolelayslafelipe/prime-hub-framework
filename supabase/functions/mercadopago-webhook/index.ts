import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response('OK', { status: 200 }); // Return 200 to prevent retries
    }

    // Parse webhook notification
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Handle different notification types
    if (body.type === 'payment' || body.action === 'payment.updated' || body.action === 'payment.created') {
      const paymentId = body.data?.id || body.id;
      
      if (!paymentId) {
        console.log('No payment ID in webhook');
        return new Response('OK', { status: 200 });
      }

      console.log('Processing payment:', paymentId);

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error('Failed to fetch payment:', await paymentResponse.text());
        return new Response('OK', { status: 200 });
      }

      const payment = await paymentResponse.json();
      console.log('Payment details:', {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
      });

      const orderId = payment.external_reference;
      
      if (!orderId) {
        console.log('No order ID in payment external_reference');
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
          orderStatus = 'confirmed'; // Move order to confirmed when paid
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

      console.log('Updating order:', orderId, { paymentStatus, orderStatus });

      // Update order payment status
      const updateData: Record<string, string> = {
        payment_status: paymentStatus,
        mp_payment_id: String(payment.id),
      };

      if (orderStatus) {
        updateData.status = orderStatus;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
      } else {
        console.log('Order updated successfully');
      }

    } else if (body.type === 'merchant_order') {
      // Handle merchant order notifications (for checkout preferences)
      const merchantOrderId = body.data?.id;
      
      if (merchantOrderId) {
        console.log('Processing merchant order:', merchantOrderId);
        
        const moResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (moResponse.ok) {
          const merchantOrder = await moResponse.json();
          console.log('Merchant order:', merchantOrder);
          
          // If there are payments, process them
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
              
              console.log('Order updated from merchant order');
            }
          }
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 to prevent Mercado Pago from retrying
    return new Response('OK', { status: 200 });
  }
});
