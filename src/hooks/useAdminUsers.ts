import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from './useAuditLog';

type AppRole = 'client' | 'admin' | 'kitchen' | 'motoboy';

export interface InternalUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'kitchen' | 'motoboy';
  isActive?: boolean;
}

interface UpdateUserData {
  email?: string;
  name?: string;
  phone?: string | null;
  isActive?: boolean;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logUserAction } = useAuditLog();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Use edge function to get users with emails
      const response = await supabase.functions.invoke('admin-list-users');

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao carregar usuários');
      }

      const usersWithRoles: InternalUser[] = (response.data.users || []).map((user: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
      }) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role as AppRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (data: CreateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone || null,
          role: data.role,
          isActive: data.isActive ?? true,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao criar usuário');
      }

      // Audit log is handled in edge function
      toast.success('Usuário criado com sucesso!');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userId: string, data: UpdateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Não autenticado');
      }

      // Use edge function to update user (required for email changes)
      const response = await supabase.functions.invoke('admin-update-user', {
        body: {
          userId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          isActive: data.isActive,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao atualizar usuário');
      }

      toast.success('Usuário atualizado com sucesso!');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
    const user = users.find(u => u.id === userId);
    
    const result = await updateUser(userId, { isActive });
    
    if (result.success) {
      // Log specific toggle action
      await logUserAction('toggle_user_status', userId, user?.name || 'Unknown', {
        new_status: isActive,
        previous_status: !isActive,
        role: user?.role,
      });
    }
    
    return result;
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao excluir usuário');
      }

      // Audit log is handled in edge function
      toast.success('Usuário excluído com sucesso!');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
  };
}
