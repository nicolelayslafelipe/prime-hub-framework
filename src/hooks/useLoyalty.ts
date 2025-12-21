import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoyaltySettings {
  id: string;
  is_active: boolean;
  points_per_real: number;
  minimum_redemption: number;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
  sort_order: number;
}

export function useLoyalty() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [settingsResult, rewardsResult] = await Promise.all([
        supabase.from('loyalty_settings').select('*').maybeSingle(),
        supabase.from('loyalty_rewards').select('*').order('sort_order')
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (rewardsResult.error) throw rewardsResult.error;

      setSettings(settingsResult.data);
      setRewards(rewardsResult.data || []);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast.error('Erro ao carregar programa de fidelidade');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateSettings = useCallback(async (updates: Partial<LoyaltySettings>): Promise<boolean> => {
    if (!settings) return false;
    
    const previousSettings = { ...settings };
    setSettings(prev => prev ? { ...prev, ...updates } : null);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('loyalty_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Configurações de fidelidade salvas!');
      return true;
    } catch (error) {
      console.error('Error updating loyalty settings:', error);
      setSettings(previousSettings);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const toggleReward = useCallback(async (id: string): Promise<boolean> => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return false;

    const previousRewards = [...rewards];
    setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .update({ is_active: !reward.is_active })
        .eq('id', id);

      if (error) throw error;

      toast.success(`${reward.name} ${!reward.is_active ? 'ativada' : 'desativada'}!`);
      return true;
    } catch (error) {
      console.error('Error toggling reward:', error);
      setRewards(previousRewards);
      toast.error('Erro ao atualizar recompensa');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [rewards]);

  const addReward = useCallback(async (reward: Omit<LoyaltyReward, 'id' | 'sort_order'>): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .insert({ ...reward, sort_order: rewards.length })
        .select()
        .single();

      if (error) throw error;

      setRewards(prev => [...prev, data]);
      toast.success('Recompensa adicionada!');
      return true;
    } catch (error) {
      console.error('Error adding reward:', error);
      toast.error('Erro ao adicionar recompensa');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [rewards.length]);

  const deleteReward = useCallback(async (id: string): Promise<boolean> => {
    const previousRewards = [...rewards];
    setRewards(prev => prev.filter(r => r.id !== id));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Recompensa removida!');
      return true;
    } catch (error) {
      console.error('Error deleting reward:', error);
      setRewards(previousRewards);
      toast.error('Erro ao remover recompensa');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [rewards]);

  return {
    settings,
    rewards,
    isLoading,
    isSaving,
    updateSettings,
    toggleReward,
    addReward,
    deleteReward,
    refetch: fetchData
  };
}
