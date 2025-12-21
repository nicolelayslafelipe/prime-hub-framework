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
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { provider } = await req.json();

    if (provider === 'mercadopago') {
      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      
      if (!accessToken) {
        return new Response(
          JSON.stringify({ 
            connected: false, 
            message: 'Token não configurado. Configure o MERCADO_PAGO_ACCESS_TOKEN nos secrets.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const response = await fetch('https://api.mercadopago.com/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('MP connection test failed:', errorData);
          return new Response(
            JSON.stringify({ 
              connected: false, 
              message: 'Token inválido ou expirado' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userData = await response.json();
        console.log('MP connection test successful for user:', userData.id);

        // Update admin_settings status
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

        return new Response(
          JSON.stringify({ 
            connected: true, 
            message: 'Conexão verificada com sucesso',
            account: {
              id: userData.id,
              nickname: userData.nickname,
              email: userData.email
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (fetchError) {
        console.error('MP connection test error:', fetchError);
        return new Response(
          JSON.stringify({ 
            connected: false, 
            message: 'Erro ao conectar com Mercado Pago' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Provider não suportado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Connection test error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
