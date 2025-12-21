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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem atualizar credenciais.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { provider, accessToken } = await req.json();

    if (!provider || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Provider e accessToken são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format
    if (provider === 'mercadopago') {
      if (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-')) {
        return new Response(
          JSON.stringify({ error: 'Token inválido. Deve começar com APP_USR- ou TEST-' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log audit event
    await supabase
      .from('admin_audit_logs')
      .insert({
        user_id: user.id,
        action: 'update_credentials',
        resource: provider,
        details: { 
          provider,
          token_prefix: accessToken.substring(0, 10) + '...',
          timestamp: new Date().toISOString()
        }
      });

    console.log(`Credentials update requested by admin ${user.id} for provider ${provider}`);

    // Note: In a real production environment, you would update the secret here
    // For Supabase, secrets are managed through the dashboard or CLI
    // This function validates the token format and logs the action
    // The actual secret update would require Supabase Management API access

    // For now, we validate the token works by making a test call
    if (provider === 'mercadopago') {
      try {
        const testResponse = await fetch('https://api.mercadopago.com/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          console.error('Token validation failed:', errorData);
          return new Response(
            JSON.stringify({ error: 'Token inválido. Verifique suas credenciais no Mercado Pago.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userData = await testResponse.json();
        console.log('Token validated for MP user:', userData.id);

        // Update admin_settings to mark as connected
        await supabase
          .from('admin_settings')
          .upsert({
            key: 'mercado_pago',
            value: {
              isActive: true,
              environment: accessToken.startsWith('TEST-') ? 'test' : 'production',
              status: 'connected'
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });

      } catch (validationError) {
        console.error('Token validation error:', validationError);
        return new Response(
          JSON.stringify({ error: 'Erro ao validar token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credenciais validadas e configuração atualizada',
        note: 'Para atualizar o secret MERCADO_PAGO_ACCESS_TOKEN, acesse as configurações do Lovable Cloud'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Update credentials error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
