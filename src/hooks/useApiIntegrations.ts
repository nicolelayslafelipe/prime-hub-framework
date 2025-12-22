import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiIntegration {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  environment: string;
  status: string;
  config: Record<string, any>;
}

// Check if current user is admin
const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;

    const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userData.user.id });
    return roleData === 'admin';
  } catch {
    return false;
  }
};

export function useApiIntegrations() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if user is admin before fetching
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        // Non-admin users should not see integrations
        setIntegrations([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('api_integrations')
        .select('*')
        .order('name');

      if (error) throw error;
      setIntegrations((data || []).map(d => ({
        ...d,
        config: (d.config as Record<string, any>) || {}
      })));
    } catch (error) {
      console.error('Error fetching API integrations:', error);
      // Only show error for admins (expected to fail for non-admins)
      if (isAdmin) {
        toast.error('Erro ao carregar integrações');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const toggleIntegration = useCallback(async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      console.error('Only admins can toggle integrations');
      return false;
    }

    const integration = integrations.find(i => i.id === id);
    if (!integration) return false;

    const previousIntegrations = [...integrations];
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('api_integrations')
        .update({ is_active: !integration.is_active })
        .eq('id', id);

      if (error) throw error;

      toast.success(`${integration.name} ${!integration.is_active ? 'ativada' : 'desativada'}!`);
      return true;
    } catch (error) {
      console.error('Error toggling integration:', error);
      setIntegrations(previousIntegrations);
      toast.error('Erro ao atualizar integração');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [integrations, isAdmin]);

  const updateIntegration = useCallback(async (id: string, updates: Partial<ApiIntegration>): Promise<boolean> => {
    if (!isAdmin) {
      console.error('Only admins can update integrations');
      return false;
    }

    const previousIntegrations = [...integrations];
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('api_integrations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Integração atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating integration:', error);
      setIntegrations(previousIntegrations);
      toast.error('Erro ao atualizar integração');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [integrations, isAdmin]);

  const getIntegrationByType = useCallback((type: string): ApiIntegration | undefined => {
    return integrations.find(i => i.type === type);
  }, [integrations]);

  return {
    integrations,
    isLoading,
    isSaving,
    toggleIntegration,
    updateIntegration,
    getIntegrationByType,
    refetch: fetchIntegrations
  };
}
