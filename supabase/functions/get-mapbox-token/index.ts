import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to fetch the token from admin_settings
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // First try to get token from admin_settings (admin-configured token)
    const { data: tokenData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'mapbox_token')
      .maybeSingle();

    let mapboxToken = tokenData?.value?.token;

    // Fallback to environment variable if no admin-configured token
    if (!mapboxToken) {
      mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    }
    
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get credentials version for cache busting
    const { data: configData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'mapbox_config')
      .maybeSingle();

    const credentialsVersion = (configData?.value as any)?.credentialsVersion || 1;

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: mapboxToken,
        version: credentialsVersion
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-mapbox-token] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
