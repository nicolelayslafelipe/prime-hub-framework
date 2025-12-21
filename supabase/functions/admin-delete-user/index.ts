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
      throw new Error('Cabeçalho de autorização ausente');
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
      throw new Error('Não autorizado: Token inválido');
    }

    // Check if the current user is an admin
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: currentUser.id,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      throw new Error('Proibido: Apenas administradores podem excluir usuários');
    }

    // Parse request body
    const { userId } = await req.json();

    // Validate required fields
    if (!userId) {
      throw new Error('Campo obrigatório ausente: userId');
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      throw new Error('Não é possível excluir sua própria conta');
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get target user info for audit log
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('name, phone')
      .eq('id', userId)
      .single();

    const { data: targetRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Check if target user is an admin
    const { data: targetIsAdmin } = await adminClient.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (targetIsAdmin) {
      // Count total admins to prevent deleting the last one
      const { count: adminCount } = await adminClient
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      console.log(`Admin count: ${adminCount}`);

      if (adminCount && adminCount <= 1) {
        // Log failed attempt
        await adminClient.from('admin_audit_logs').insert({
          user_id: currentUser.id,
          action: 'delete_user_failed',
          resource: 'users',
          details: {
            target_user_id: userId,
            target_name: targetProfile?.name,
            target_role: targetRole?.role,
            reason: 'Cannot delete last admin',
            timestamp: new Date().toISOString(),
          },
        });
        
        throw new Error('Não é possível excluir o último administrador do sistema');
      }
    }

    // Check if user has order history
    const { count: ordersCount } = await adminClient
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', userId);

    console.log(`User ${userId} has ${ordersCount} orders`);

    if (ordersCount && ordersCount > 0) {
      // Soft delete: just deactivate the user
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (updateError) {
        console.error('Error soft deleting user:', updateError);
        throw new Error(`Erro ao desativar usuário: ${updateError.message}`);
      }

      // Log soft delete
      await adminClient.from('admin_audit_logs').insert({
        user_id: currentUser.id,
        action: 'soft_delete_user',
        resource: 'users',
        details: {
          target_user_id: userId,
          target_name: targetProfile?.name,
          target_role: targetRole?.role,
          reason: 'User has order history',
          orders_count: ordersCount,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`User soft deleted (deactivated): ${userId}`);
      console.log(`Audit log recorded for soft delete by admin ${currentUser.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          softDeleted: true,
          message: 'Usuário desativado com sucesso (possui histórico de pedidos)',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Hard delete: no order history
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      
      // Log failed hard delete
      await adminClient.from('admin_audit_logs').insert({
        user_id: currentUser.id,
        action: 'delete_user_failed',
        resource: 'users',
        details: {
          target_user_id: userId,
          target_name: targetProfile?.name,
          target_role: targetRole?.role,
          error: deleteError.message,
          timestamp: new Date().toISOString(),
        },
      });
      
      throw new Error(`Erro ao excluir usuário: ${deleteError.message}`);
    }

    // Log successful hard delete
    await adminClient.from('admin_audit_logs').insert({
      user_id: currentUser.id,
      action: 'hard_delete_user',
      resource: 'users',
      details: {
        target_user_id: userId,
        target_name: targetProfile?.name,
        target_role: targetRole?.role,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`User hard deleted: ${userId}`);
    console.log(`Audit log recorded for hard delete by admin ${currentUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        softDeleted: false,
        message: 'Usuário excluído com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in admin-delete-user:', err);
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage.includes('Proibido') ? 403 : 
               errorMessage.includes('Não autorizado') ? 401 : 400,
      }
    );
  }
});
