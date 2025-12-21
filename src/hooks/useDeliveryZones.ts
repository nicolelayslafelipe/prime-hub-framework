import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  min_order: number;
  estimated_time: number;
  is_active: boolean;
  sort_order: number;
}

export function useDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      toast.error('Erro ao carregar zonas de entrega');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const addZone = useCallback(async (zone: Omit<DeliveryZone, 'id' | 'sort_order'>) => {
    try {
      const maxOrder = zones.length > 0 ? Math.max(...zones.map(z => z.sort_order)) + 1 : 0;
      
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({ ...zone, sort_order: maxOrder })
        .select()
        .single();

      if (error) throw error;
      
      setZones(prev => [...prev, data]);
      toast.success('Zona adicionada!');
      return true;
    } catch (error) {
      console.error('Error adding delivery zone:', error);
      toast.error('Erro ao adicionar zona');
      return false;
    }
  }, [zones]);

  const updateZone = useCallback(async (id: string, updates: Partial<DeliveryZone>) => {
    const previousZones = zones;
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));

    try {
      const { error } = await supabase
        .from('delivery_zones')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Zona atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating delivery zone:', error);
      setZones(previousZones);
      toast.error('Erro ao atualizar zona');
      return false;
    }
  }, [zones]);

  const deleteZone = useCallback(async (id: string) => {
    const previousZones = zones;
    setZones(prev => prev.filter(z => z.id !== id));

    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Zona removida!');
      return true;
    } catch (error) {
      console.error('Error deleting delivery zone:', error);
      setZones(previousZones);
      toast.error('Erro ao remover zona');
      return false;
    }
  }, [zones]);

  const toggleZone = useCallback(async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (zone) {
      return updateZone(id, { is_active: !zone.is_active });
    }
    return false;
  }, [zones, updateZone]);

  return {
    zones,
    isLoading,
    addZone,
    updateZone,
    deleteZone,
    toggleZone,
    refetch: fetchZones
  };
}
