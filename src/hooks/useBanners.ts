import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching banners:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBanner = async (banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert(banner)
        .select()
        .single();

      if (error) throw error;
      setBanners(prev => [...prev, data]);
      toast.success('Banner criado com sucesso!');
      return data;
    } catch (err: any) {
      toast.error('Erro ao criar banner: ' + err.message);
      throw err;
    }
  };

  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBanners(prev => prev.map(b => b.id === id ? data : b));
      toast.success('Banner atualizado!');
      return data;
    } catch (err: any) {
      toast.error('Erro ao atualizar banner: ' + err.message);
      throw err;
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success('Banner removido!');
    } catch (err: any) {
      toast.error('Erro ao remover banner: ' + err.message);
      throw err;
    }
  };

  const toggleBanner = async (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    await updateBanner(id, { is_active: !banner.is_active });
  };

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners,
    isLoading,
    error,
    refetch: fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBanner,
  };
}
