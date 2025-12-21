import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  order_id: string;
  payment_type: 'pix' | 'card';
  customer_email?: string;
  description?: string;
  amount: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('MERCADO_PAGO_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, payment_type, customer_email, description, amount }: PaymentRequest = await req.json();

    console.log('Creating payment:', { order_id, payment_type, amount });

    if (!order_id || !payment_type || !amount) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let paymentResult;

    if (payment_type === 'pix') {
      // Calculate expiration: 5 minutes from now
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 5);

      // Create PIX payment
      const pixPayload = {
        transaction_amount: amount,
        description: description || `Pedido #${order.order_number}`,
        payment_method_id: 'pix',
        date_of_expiration: expirationDate.toISOString(),
        payer: {
          email: customer_email || 'cliente@delivery.com',
        },
        external_reference: order_id,
      };

      console.log('Creating PIX payment:', pixPayload);

      const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${order_id}-${Date.now()}`,
        },
        body: JSON.stringify(pixPayload),
      });

      const pixData = await pixResponse.json();

      if (!pixResponse.ok) {
        console.error('PIX creation failed:', pixData);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar pagamento PIX', details: pixData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('PIX payment created:', pixData.id);

      // Extract QR Code data
      const qrCodeData = pixData.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = pixData.point_of_interaction?.transaction_data?.qr_code_base64;

      // Update order with payment info
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
          mp_payment_id: String(pixData.id),
          mp_qr_code: qrCodeData,
        })
        .eq('id', order_id);

      paymentResult = {
        payment_id: pixData.id,
        status: pixData.status,
        qr_code: qrCodeData,
        qr_code_base64: qrCodeBase64,
        expiration_date: pixData.date_of_expiration,
      };

    } else {
      // Create Checkout Pro preference for card
      const preferencePayload = {
        items: [
          {
            title: description || `Pedido #${order.order_number}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: customer_email || 'cliente@delivery.com',
        },
        external_reference: order_id,
        back_urls: {
          success: `${req.headers.get('origin')}/minha-conta/pedidos?payment=success`,
          failure: `${req.headers.get('origin')}/minha-conta/pedidos?payment=failure`,
          pending: `${req.headers.get('origin')}/minha-conta/pedidos?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      };

      console.log('Creating preference:', preferencePayload);

      const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      });

      const prefData = await prefResponse.json();

      if (!prefResponse.ok) {
        console.error('Preference creation failed:', prefData);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar checkout', details: prefData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Preference created:', prefData.id);

      // Update order with preference info
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
          mp_preference_id: prefData.id,
          mp_checkout_url: prefData.init_point,
        })
        .eq('id', order_id);

      paymentResult = {
        preference_id: prefData.id,
        checkout_url: prefData.init_point,
        sandbox_checkout_url: prefData.sandbox_init_point,
      };
    }

    return new Response(
      JSON.stringify(paymentResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Payment creation error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
