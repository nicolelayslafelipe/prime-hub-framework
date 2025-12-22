import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CredentialsState {
  mapboxVersion: number;
  mercadoPagoVersion: number;
  lastUpdate: string | null;
}

interface CredentialsContextType {
  credentials: CredentialsState;
  refreshCredentials: () => Promise<void>;
  incrementMapboxVersion: () => void;
  incrementMercadoPagoVersion: () => void;
}

const defaultCredentials: CredentialsState = {
  mapboxVersion: 1,
  mercadoPagoVersion: 1,
  lastUpdate: null
};

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function CredentialsProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<CredentialsState>(defaultCredentials);

  const fetchCredentials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['mapbox_config', 'mercadopago_config']);

      if (error) {
        console.error('Error fetching credentials:', error);
        return;
      }

      const mapboxConfig = data?.find(d => d.key === 'mapbox_config');
      const mercadoPagoConfig = data?.find(d => d.key === 'mercadopago_config');

      setCredentials({
        mapboxVersion: (mapboxConfig?.value as any)?.credentialsVersion || 1,
        mercadoPagoVersion: (mercadoPagoConfig?.value as any)?.credentialsVersion || 1,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  }, []);

  const refreshCredentials = useCallback(async () => {
    await fetchCredentials();
  }, [fetchCredentials]);

  const incrementMapboxVersion = useCallback(() => {
    setCredentials(prev => ({
      ...prev,
      mapboxVersion: prev.mapboxVersion + 1,
      lastUpdate: new Date().toISOString()
    }));
  }, []);

  const incrementMercadoPagoVersion = useCallback(() => {
    setCredentials(prev => ({
      ...prev,
      mercadoPagoVersion: prev.mercadoPagoVersion + 1,
      lastUpdate: new Date().toISOString()
    }));
  }, []);

  // Fetch initial credentials
  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Subscribe to realtime changes in admin_settings
  useEffect(() => {
    const channel = supabase
      .channel('credentials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_settings',
          filter: 'key=in.(mapbox_config,mercadopago_config,mapbox_token)'
        },
        (payload) => {
          console.log('Credentials updated:', payload);
          // Defer the fetch to avoid potential deadlocks
          setTimeout(() => {
            fetchCredentials();
          }, 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCredentials]);

  return (
    <CredentialsContext.Provider value={{ 
      credentials, 
      refreshCredentials, 
      incrementMapboxVersion, 
      incrementMercadoPagoVersion 
    }}>
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const context = useContext(CredentialsContext);
  if (context === undefined) {
    throw new Error('useCredentials must be used within a CredentialsProvider');
  }
  return context;
}
