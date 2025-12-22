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
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem testar conexão.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the stored token from admin_settings or env
    const { data: tokenData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'mapbox_token')
      .maybeSingle();

    let mapboxToken = tokenData?.value?.token;

    // Fallback to environment variable
    if (!mapboxToken) {
      mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    }

    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token do Mapbox não configurado' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test the token with Mapbox API
    const testUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${mapboxToken}&limit=1`;
    const testResponse = await fetch(testUrl);

    if (!testResponse.ok) {
      console.error('Mapbox connection test failed:', testResponse.status);
      
      // Log the test failure
      await supabaseAdmin.from('admin_audit_logs').insert({
        user_id: user.id,
        action: 'TEST',
        resource: 'mapbox_credentials',
        details: {
          action: 'connection_test',
          result: 'failed',
          status_code: testResponse.status,
          timestamp: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido ou expirado' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful test
    await supabaseAdmin.from('admin_audit_logs').insert({
      user_id: user.id,
      action: 'TEST',
      resource: 'mapbox_credentials',
      details: {
        action: 'connection_test',
        result: 'success',
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conexão com Mapbox verificada com sucesso' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-mapbox-connection:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
