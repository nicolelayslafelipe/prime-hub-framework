import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClientPreferences {
  id: string;
  user_id: string;
  push_notifications: boolean;
  promo_notifications: boolean;
  save_payment_method: boolean;
  last_payment_method: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<ClientPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  push_notifications: true,
  promo_notifications: false,
  save_payment_method: true,
  last_payment_method: null,
};

export function useClientPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ClientPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences for new user
        const { data: newPrefs, error: insertError } = await supabase
          .from('client_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(async <K extends keyof ClientPreferences>(
    key: K,
    value: ClientPreferences[K]
  ) => {
    if (!user || !preferences) return;

    setIsSaving(true);
    
    // Optimistic update
    const previousPreferences = preferences;
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    try {
      const { error } = await supabase
        .from('client_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Preferência salva');
    } catch (error) {
      console.error('Error updating preference:', error);
      // Revert on error
      setPreferences(previousPreferences);
      toast.error('Erro ao salvar preferência');
    } finally {
      setIsSaving(false);
    }
  }, [user, preferences]);

  const updateMultiplePreferences = useCallback(async (
    updates: Partial<Omit<ClientPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user || !preferences) return;

    setIsSaving(true);
    
    // Optimistic update
    const previousPreferences = preferences;
    setPreferences(prev => prev ? { ...prev, ...updates } : null);

    try {
      const { error } = await supabase
        .from('client_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferences(previousPreferences);
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsSaving(false);
    }
  }, [user, preferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreference,
    updateMultiplePreferences,
    refetch: fetchPreferences,
  };
}
