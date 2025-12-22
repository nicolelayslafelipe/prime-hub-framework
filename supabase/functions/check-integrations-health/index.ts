import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  key: string;
  status: 'online' | 'error';
  latency_ms: number;
  error_message?: string;
}

async function checkMercadoPago(accessToken: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return { key: 'mercadopago', status: 'online', latency_ms: latency };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        key: 'mercadopago', 
        status: 'error', 
        latency_ms: latency,
        error_message: errorData.message || `HTTP ${response.status}`
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
    return { 
      key: 'mercadopago', 
      status: 'error', 
      latency_ms: Date.now() - startTime,
      error_message: errorMessage
    };
  }
}

async function checkMapbox(accessToken: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${accessToken}&limit=1`
    );

    const latency = Date.now() - startTime;

    if (response.ok) {
      return { key: 'mapbox', status: 'online', latency_ms: latency };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { 
        key: 'mapbox', 
        status: 'error', 
        latency_ms: latency,
        error_message: errorData.message || `HTTP ${response.status}`
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
    return { 
      key: 'mapbox', 
      status: 'error', 
      latency_ms: Date.now() - startTime,
      error_message: errorMessage
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: HealthCheckResult[] = [];

    // Check Mercado Pago
    const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (mpToken) {
      const mpResult = await checkMercadoPago(mpToken);
      results.push(mpResult);
    } else {
      results.push({ 
        key: 'mercadopago', 
        status: 'error', 
        latency_ms: 0,
        error_message: 'Token não configurado'
      });
    }

    // Check Mapbox
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (mapboxToken) {
      const mapboxResult = await checkMapbox(mapboxToken);
      results.push(mapboxResult);
    } else {
      results.push({ 
        key: 'mapbox', 
        status: 'error', 
        latency_ms: 0,
        error_message: 'Token não configurado'
      });
    }

    // Process results and update database
    for (const result of results) {
      // Get current status
      const { data: currentStatus } = await supabase
        .from('integration_status')
        .select('*')
        .eq('integration_key', result.key)
        .single();

      if (!currentStatus) continue;

      const wasOnline = currentStatus.status === 'online';
      const isNowOnline = result.status === 'online';
      const statusChanged = wasOnline !== isNowOnline;

      // Calculate new error count
      const newErrorCount = isNowOnline ? 0 : (currentStatus.error_count || 0) + 1;

      // Update status
      const updateData: any = {
        status: result.status,
        last_check: new Date().toISOString(),
        latency_ms: result.latency_ms,
        error_count: newErrorCount,
        error_message: result.error_message || null
      };

      if (isNowOnline) {
        updateData.last_success = new Date().toISOString();
      } else {
        updateData.last_error = new Date().toISOString();
      }

      // Fail-safe: if error count reaches threshold, deactivate
      const FAIL_SAFE_THRESHOLD = 5;
      let failSafeActivated = false;
      let failSafeDeactivated = false;

      if (newErrorCount >= FAIL_SAFE_THRESHOLD && currentStatus.is_active) {
        updateData.is_active = false;
        failSafeActivated = true;
      } else if (isNowOnline && !currentStatus.is_active && currentStatus.error_count >= FAIL_SAFE_THRESHOLD) {
        // Auto-reactivate when recovered
        updateData.is_active = true;
        failSafeDeactivated = true;
      }

      await supabase
        .from('integration_status')
        .update(updateData)
        .eq('integration_key', result.key);

      // Log events
      if (statusChanged) {
        await supabase.from('integration_logs').insert({
          integration_key: result.key,
          event_type: isNowOnline ? 'recovery' : 'error',
          status: result.status,
          message: isNowOnline 
            ? 'Integração recuperada' 
            : `Erro detectado: ${result.error_message}`,
          details: { latency_ms: result.latency_ms }
        });

        // Create admin notification for errors
        if (!isNowOnline) {
          const integrationName = result.key === 'mercadopago' ? 'Mercado Pago' : 'Mapbox';
          await supabase.from('admin_notifications').insert({
            type: 'integration_error',
            title: `Erro: ${integrationName}`,
            message: result.error_message || 'Falha na conexão com a integração'
          });
        }
      }

      if (failSafeActivated) {
        const integrationName = result.key === 'mercadopago' ? 'Mercado Pago' : 'Mapbox';
        await supabase.from('integration_logs').insert({
          integration_key: result.key,
          event_type: 'fail_safe_activated',
          status: 'error',
          message: `Fail-safe ativado após ${FAIL_SAFE_THRESHOLD} erros consecutivos`,
          details: { error_count: newErrorCount }
        });

        await supabase.from('admin_notifications').insert({
          type: 'integration_fail_safe',
          title: `Fail-Safe: ${integrationName}`,
          message: `Integração desativada automaticamente após ${FAIL_SAFE_THRESHOLD} falhas consecutivas`
        });
      }

      if (failSafeDeactivated) {
        const integrationName = result.key === 'mercadopago' ? 'Mercado Pago' : 'Mapbox';
        await supabase.from('integration_logs').insert({
          integration_key: result.key,
          event_type: 'fail_safe_deactivated',
          status: 'online',
          message: 'Integração reativada automaticamente após recuperação',
          details: {}
        });

        await supabase.from('admin_notifications').insert({
          type: 'integration_recovery',
          title: `Recuperado: ${integrationName}`,
          message: 'Integração reativada automaticamente após recuperação'
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
