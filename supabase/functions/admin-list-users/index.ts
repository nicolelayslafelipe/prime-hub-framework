import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with the user's token to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      throw new Error('Unauthorized: Invalid token');
    }

    // Check if the current user is an admin
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: currentUser.id,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      throw new Error('Forbidden: Only admins can list users');
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user roles for kitchen and motoboy
    const { data: rolesData, error: rolesError } = await adminClient
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['kitchen', 'motoboy']);

    if (rolesError) throw rolesError;

    if (!rolesData || rolesData.length === 0) {
      return new Response(
        JSON.stringify({ success: true, users: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const userIds = rolesData.map(r => r.user_id);

    // Get profiles
    const { data: profilesData, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, name, phone, is_active, created_at')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // Get emails from auth.users using admin API
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    // Create a map of user IDs to emails
    const emailMap = new Map<string, string>();
    authUsers.users.forEach(user => {
      emailMap.set(user.id, user.email || '');
    });

    // Combine data
    const users = (profilesData || []).map(profile => {
      const roleRecord = rolesData.find(r => r.user_id === profile.id);
      return {
        id: profile.id,
        email: emailMap.get(profile.id) || '',
        name: profile.name || 'Sem nome',
        phone: profile.phone,
        role: roleRecord?.role || 'client',
        isActive: profile.is_active ?? true,
        createdAt: profile.created_at || new Date().toISOString(),
      };
    });

    console.log(`Listed ${users.length} internal users`);

    return new Response(
      JSON.stringify({ success: true, users }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('Error in admin-list-users:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage.includes('Forbidden') ? 403 : 
               errorMessage.includes('Unauthorized') ? 401 : 400,
      }
    );
  }
});
