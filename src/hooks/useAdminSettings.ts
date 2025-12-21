import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export function useAdminSettings<T extends Record<string, any>>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSetting = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setValue(data.value as T);
      }
    } catch (error) {
      console.error(`Error fetching admin setting ${key}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  const updateValue = useCallback(async (newValue: T): Promise<boolean> => {
    const previousValue = value;
    setValue(newValue);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key,
          value: newValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Configuração salva!');
      return true;
    } catch (error) {
      console.error(`Error updating admin setting ${key}:`, error);
      setValue(previousValue);
      toast.error('Erro ao salvar configuração');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [key, value]);

  const updateField = useCallback(async <K extends keyof T>(field: K, fieldValue: T[K]): Promise<boolean> => {
    const newValue = { ...value, [field]: fieldValue };
    return updateValue(newValue);
  }, [value, updateValue]);

  return {
    value,
    setValue,
    updateValue,
    updateField,
    isLoading,
    isSaving,
    refetch: fetchSetting
  };
}
