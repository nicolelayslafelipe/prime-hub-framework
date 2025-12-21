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

export function useApiIntegrations() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
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
      toast.error('Erro ao carregar integrações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const toggleIntegration = useCallback(async (id: string): Promise<boolean> => {
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
  }, [integrations]);

  const updateIntegration = useCallback(async (id: string, updates: Partial<ApiIntegration>): Promise<boolean> => {
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
  }, [integrations]);

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
