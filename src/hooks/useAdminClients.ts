import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from './useAuditLog';

export interface AdminClient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export function useAdminClients() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { logUserAction } = useAuditLog();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all users with client role
      const { data: clientRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');

      if (rolesError) throw rolesError;

      const clientIds = clientRoles?.map(r => r.user_id) || [];

      if (clientIds.length === 0) {
        setClients([]);
        return;
      }

      // Get profiles for these clients
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', clientIds);

      if (profilesError) throw profilesError;

      // Get order statistics for each client
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, total, created_at')
        .in('customer_id', clientIds);

      if (ordersError) throw ordersError;

      // Calculate stats per client
      const clientStats = new Map<string, { total_orders: number; total_spent: number; last_order_date: string | null }>();
      
      orders?.forEach(order => {
        const existing = clientStats.get(order.customer_id) || { 
          total_orders: 0, 
          total_spent: 0, 
          last_order_date: null 
        };
        
        existing.total_orders += 1;
        existing.total_spent += Number(order.total) || 0;
        
        if (!existing.last_order_date || order.created_at > existing.last_order_date) {
          existing.last_order_date = order.created_at;
        }
        
        clientStats.set(order.customer_id, existing);
      });

      // Get emails from auth (we need to use the edge function or just show profile data)
      // For now, we'll display phone from profile

      const clientsWithStats: AdminClient[] = (profiles || []).map(profile => {
        const stats = clientStats.get(profile.id) || { 
          total_orders: 0, 
          total_spent: 0, 
          last_order_date: null 
        };

        return {
          id: profile.id,
          name: profile.name || 'Cliente',
          phone: profile.phone,
          email: null, // Email is in auth.users, not directly accessible
          avatar_url: profile.avatar_url,
          is_active: profile.is_active,
          created_at: profile.created_at,
          total_orders: stats.total_orders,
          total_spent: stats.total_spent,
          last_order_date: stats.last_order_date,
        };
      });

      // Sort by total spent descending
      clientsWithStats.sort((a, b) => b.total_spent - a.total_spent);

      setClients(clientsWithStats);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleClientStatus = useCallback(async (clientId: string, currentStatus: boolean) => {
    try {
      const client = clients.find(c => c.id === clientId);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setClients(prev => 
        prev.map(c => c.id === clientId ? { ...c, is_active: !currentStatus } : c)
      );

      // Log the action
      await logUserAction('toggle_user_status', clientId, client?.name || 'Unknown', {
        new_status: !currentStatus,
        previous_status: currentStatus,
        role: 'client',
        total_orders: client?.total_orders,
        total_spent: client?.total_spent,
      });

      toast.success(currentStatus ? 'Cliente bloqueado' : 'Cliente ativado');
    } catch (err) {
      console.error('Error toggling client status:', err);
      toast.error('Erro ao alterar status do cliente');
    }
  }, [clients, logUserAction]);

  const deleteClient = useCallback(async (clientId: string): Promise<{ success: boolean; softDeleted?: boolean }> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: clientId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao excluir cliente');
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir cliente');
      }

      // Audit log is handled in edge function

      if (result.softDeleted) {
        // Update local state for soft delete
        setClients(prev => 
          prev.map(c => c.id === clientId ? { ...c, is_active: false } : c)
        );
        toast.success('Cliente desativado (possui histórico de pedidos)');
        return { success: true, softDeleted: true };
      } else {
        // Remove from local state for hard delete
        setClients(prev => prev.filter(c => c.id !== clientId));
        toast.success('Cliente excluído com sucesso');
        return { success: true, softDeleted: false };
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      const message = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      toast.error(message);
      return { success: false };
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    toggleClientStatus,
    deleteClient,
  };
}
