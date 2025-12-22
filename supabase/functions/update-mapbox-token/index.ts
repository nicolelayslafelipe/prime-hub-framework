import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for admin checks
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem alterar credenciais.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { accessToken } = await req.json();

    if (!accessToken || typeof accessToken !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Token de acesso é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (should start with pk.)
    if (!accessToken.startsWith('pk.')) {
      return new Response(
        JSON.stringify({ error: 'Token público do Mapbox deve começar com "pk."' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test the token with Mapbox API
    const testUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${accessToken}&limit=1`;
    const testResponse = await fetch(testUrl);

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      console.error('Mapbox token validation failed:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido. Verifique se o token está correto e ativo.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit entry
    await supabaseAdmin.from('admin_audit_logs').insert({
      user_id: user.id,
      action: 'UPDATE',
      resource: 'mapbox_credentials',
      details: {
        action: 'token_updated',
        token_prefix: accessToken.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      }
    });

    // Store the token (in production, use Supabase secrets management)
    // For now, we'll store it in admin_settings with the status
    const { error: updateError } = await supabaseAdmin
      .from('admin_settings')
      .upsert({
        key: 'mapbox_token',
        value: { 
          token: accessToken,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (updateError) {
      console.error('Error storing Mapbox token:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Token do Mapbox atualizado com sucesso' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-mapbox-token:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
