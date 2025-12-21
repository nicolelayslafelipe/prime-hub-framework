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
      throw new Error('Forbidden: Only admins can update users');
    }

    // Parse request body
    const { userId, email, name, phone, isActive } = await req.json();

    // Validate required fields
    if (!userId) {
      throw new Error('Missing required field: userId');
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const changes: Record<string, unknown> = {};

    // Update email if provided (requires admin API)
    if (email) {
      const { data: updatedUser, error: emailError } = await adminClient.auth.admin.updateUserById(
        userId,
        { email, email_confirm: true }
      );

      if (emailError) {
        console.error('Error updating email:', emailError);
        throw new Error(`Failed to update email: ${emailError.message}`);
      }

      changes.email = email;
      console.log(`Email updated for user ${userId} to ${email}`);
    }

    // Update profile if name, phone, or isActive provided
    if (name !== undefined || phone !== undefined || isActive !== undefined) {
      const profileUpdate: Record<string, unknown> = {};
      
      if (name !== undefined) {
        profileUpdate.name = name;
        changes.name = name;
      }
      if (phone !== undefined) {
        profileUpdate.phone = phone;
        changes.phone = phone;
      }
      if (isActive !== undefined) {
        profileUpdate.is_active = isActive;
        changes.is_active = isActive;
      }

      const { error: profileError } = await adminClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
    }

    // Log successful user update
    await adminClient.from('admin_audit_logs').insert({
      user_id: currentUser.id,
      action: 'update_user',
      resource: 'users',
      details: {
        target_user_id: userId,
        changes,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`User updated successfully: ${userId}`);
    console.log(`Audit log recorded for user update by admin ${currentUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        changes,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in admin-update-user:', err);
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
