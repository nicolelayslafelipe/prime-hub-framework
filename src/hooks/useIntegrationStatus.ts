import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IntegrationStatus {
  id: string;
  integration_key: string;
  integration_name: string;
  status: 'online' | 'error' | 'unknown';
  is_active: boolean;
  last_check: string | null;
  last_success: string | null;
  last_error: string | null;
  error_message: string | null;
  error_count: number;
  latency_ms: number | null;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  integration_key: string;
  event_type: 'health_check' | 'status_change' | 'error' | 'recovery' | 'fail_safe_activated' | 'fail_safe_deactivated';
  status: string;
  message: string | null;
  details: Record<string, any>;
  created_at: string;
}

interface UseIntegrationStatusReturn {
  integrations: IntegrationStatus[];
  logs: IntegrationLog[];
  isLoading: boolean;
  error: string | null;
  hasErrors: boolean;
  getIntegration: (key: string) => IntegrationStatus | undefined;
  refetch: () => Promise<void>;
  checkHealth: () => Promise<void>;
}

export function useIntegrationStatus(): UseIntegrationStatusReturn {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch integrations status
      const { data: statusData, error: statusError } = await supabase
        .from('integration_status')
        .select('*')
        .order('integration_name');

      if (statusError) throw statusError;

      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setIntegrations((statusData || []) as IntegrationStatus[]);
      setLogs((logsData || []) as IntegrationLog[]);
    } catch (err) {
      console.error('Error fetching integration status:', err);
      setError('Erro ao carregar status das integrações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('check-integrations-health');
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error checking health:', err);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const statusChannel = supabase
      .channel('integration-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_status'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setIntegrations(prev => {
              const updated = prev.filter(i => i.id !== payload.new.id);
              return [...updated, payload.new as IntegrationStatus].sort((a, b) => 
                a.integration_name.localeCompare(b.integration_name)
              );
            });
          }
        }
      )
      .subscribe();

    const logsChannel = supabase
      .channel('integration-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_logs'
        },
        (payload) => {
          setLogs(prev => [payload.new as IntegrationLog, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [fetchData]);

  const hasErrors = integrations.some(i => i.status === 'error' && i.is_active);
  
  const getIntegration = useCallback((key: string) => {
    return integrations.find(i => i.integration_key === key);
  }, [integrations]);

  return {
    integrations,
    logs,
    isLoading,
    error,
    hasErrors,
    getIntegration,
    refetch: fetchData,
    checkHealth
  };
}
