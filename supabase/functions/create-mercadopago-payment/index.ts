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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Pagamento não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, payment_type, customer_email, description, amount }: PaymentRequest = await req.json();

    if (!order_id || !payment_type || !amount) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('customer_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if establishment is open
    const { data: establishmentSettings } = await supabaseAdmin
      .from('establishment_settings')
      .select('is_open')
      .limit(1)
      .single();

    if (establishmentSettings && !establishmentSettings.is_open) {
      return new Response(
        JSON.stringify({ error: 'Estabelecimento fechado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment method is active
    const paymentTypeDB = payment_type === 'pix' ? 'pix' : 'credit';
    const { data: paymentMethodActive } = await supabaseAdmin
      .from('payment_methods')
      .select('is_active')
      .eq('type', paymentTypeDB)
      .limit(1)
      .single();

    if (paymentMethodActive && !paymentMethodActive.is_active) {
      return new Response(
        JSON.stringify({ error: 'Forma de pagamento desativada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let paymentResult;

    if (payment_type === 'pix') {
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 5);

      const pixPayload = {
        transaction_amount: amount,
        description: description || `Pedido #${order.order_number}`,
        payment_method_id: 'pix',
        date_of_expiration: expirationDate.toISOString(),
        payer: {
          email: customer_email || user.email || 'cliente@delivery.com',
        },
        external_reference: order_id,
      };

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
        console.error('PIX creation failed');
        return new Response(
          JSON.stringify({ error: 'Erro ao criar pagamento' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qrCodeData = pixData.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = pixData.point_of_interaction?.transaction_data?.qr_code_base64;

      await supabaseAdmin
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
          email: customer_email || user.email || 'cliente@delivery.com',
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
        console.error('Preference creation failed');
        return new Response(
          JSON.stringify({ error: 'Erro ao criar checkout' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabaseAdmin
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

  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
