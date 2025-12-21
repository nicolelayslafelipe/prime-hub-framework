import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get timeout minutes from request body or default to 30
    let timeoutMinutes = 30;
    try {
      const body = await req.json();
      if (body.timeoutMinutes) {
        timeoutMinutes = body.timeoutMinutes;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    console.log(`Checking for expired payments (timeout: ${timeoutMinutes} minutes)`);

    // Calculate the cutoff time
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    // Find orders that are waiting for payment and have exceeded the timeout
    const { data: expiredOrders, error: selectError } = await supabase
      .from('orders')
      .select('id, order_number, created_at')
      .eq('status', 'waiting_payment')
      .eq('payment_status', 'pending')
      .lt('created_at', cutoffTime.toISOString());

    if (selectError) {
      console.error('Error finding expired orders:', selectError);
      throw selectError;
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      console.log('No expired orders found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired orders found',
          cancelledCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredOrders.length} expired orders:`, expiredOrders.map(o => o.order_number));

    // Cancel the expired orders
    const orderIds = expiredOrders.map(o => o.id);
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        notes: 'Pedido cancelado automaticamente - PIX expirado',
        updated_at: new Date().toISOString(),
      })
      .in('id', orderIds);

    if (updateError) {
      console.error('Error cancelling expired orders:', updateError);
      throw updateError;
    }

    console.log(`Successfully cancelled ${expiredOrders.length} expired orders`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cancelled ${expiredOrders.length} expired orders`,
        cancelledCount: expiredOrders.length,
        cancelledOrders: expiredOrders.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          createdAt: o.created_at,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-expired-payments:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
