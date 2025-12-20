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
      throw new Error('Forbidden: Only admins can delete users');
    }

    // Parse request body
    const { userId } = await req.json();

    // Validate required fields
    if (!userId) {
      throw new Error('Missing required field: userId');
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      throw new Error('Cannot delete your own account');
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if target user is an admin (prevent admin deletion)
    const { data: targetIsAdmin } = await adminClient.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (targetIsAdmin) {
      throw new Error('Cannot delete admin users');
    }

    // Delete the user (this will cascade to profiles and user_roles)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log(`User deleted successfully: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in admin-delete-user:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage.includes('Forbidden') ? 403 : 
               errorMessage.includes('Unauthorized') ? 401 : 400,
      }
    );
  }
});
