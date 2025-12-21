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
      throw new Error('Forbidden: Only admins can create users');
    }

    // Parse request body
    const { email, password, name, phone, role, isActive = true } = await req.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      throw new Error('Missing required fields: email, password, name, role');
    }

    // Validate role
    if (!['kitchen', 'motoboy'].includes(role)) {
      throw new Error('Invalid role. Must be "kitchen" or "motoboy"');
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      
      // Log failed attempt
      await adminClient.from('admin_audit_logs').insert({
        user_id: currentUser.id,
        action: 'create_user_failed',
        resource: 'users',
        details: {
          target_email: email,
          target_role: role,
          error: createError.message,
          timestamp: new Date().toISOString(),
        },
      });
      
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Failed to create user: No user returned');
    }

    // Update the profile with is_active status
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ 
        name, 
        phone: phone || null, 
        is_active: isActive 
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Profile should be created by trigger, but if update fails, log it
    }

    // Delete the default 'client' role that was created by the trigger
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', newUser.user.id);

    // Insert the new role
    const { error: roleInsertError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
      });

    if (roleInsertError) {
      console.error('Error inserting role:', roleInsertError);
      // Clean up: delete the user if role insertion fails
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to assign role: ${roleInsertError.message}`);
    }

    // Log successful user creation
    await adminClient.from('admin_audit_logs').insert({
      user_id: currentUser.id,
      action: 'create_user',
      resource: 'users',
      details: {
        target_user_id: newUser.user.id,
        target_email: email,
        target_name: name,
        target_role: role,
        is_active: isActive,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`User created successfully: ${email} with role ${role}`);
    console.log(`Audit log recorded for user creation by admin ${currentUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          name,
          role,
          isActive,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in admin-create-user:', err);
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
