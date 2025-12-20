import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  name?: string;
  phone?: string | null;
  isActive?: boolean;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profiles with their roles (only internal users: kitchen and motoboy)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['kitchen', 'motoboy']);

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = rolesData.map(r => r.user_id);

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone, is_active, created_at')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // We need to get emails from auth - we'll use a workaround by fetching from the session
      // For now, we'll use a placeholder and update when we have admin access
      const usersWithRoles: InternalUser[] = (profilesData || []).map(profile => {
        const roleRecord = rolesData.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: '', // Will be populated from edge function or stored separately
          name: profile.name || 'Sem nome',
          phone: profile.phone,
          role: (roleRecord?.role || 'client') as AppRole,
          isActive: profile.is_active ?? true,
          createdAt: profile.created_at || new Date().toISOString(),
        };
      });

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
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;

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
    return updateUser(userId, { isActive });
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
