import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function creates the initial admin user
// It can only be called once - if an admin already exists, it will fail
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if this specific admin already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(u => u.email === 'admin@admin.com');

    if (adminExists) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Admin user admin@admin.com already exists',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create the admin user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: 'admin@admin.com',
      password: '01082020',
      email_confirm: true,
      user_metadata: { name: 'Administrador' },
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      throw new Error(`Failed to create admin user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Failed to create admin user: No user returned');
    }

    const userId = newUser.user.id;

    // Update the profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ 
        name: 'Administrador',
        is_active: true 
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Delete the default 'client' role
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Insert the admin role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
      });

    if (roleError) {
      console.error('Error inserting admin role:', roleError);
      // Clean up: delete the user if role insertion fails
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(`Failed to assign admin role: ${roleError.message}`);
    }

    console.log(`Admin user created successfully: admin@admin.com`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: userId,
          email: 'admin@admin.com',
          name: 'Administrador',
          role: 'admin',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in setup-admin:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
