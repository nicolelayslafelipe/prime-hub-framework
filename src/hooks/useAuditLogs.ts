import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user_name?: string;
}

interface UseAuditLogsOptions {
  limit?: number;
  resource?: string;
  action?: string;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { limit = 50, resource, action } = options;

  const fetchLogs = useCallback(async (offset = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (resource) {
        query = query.eq('resource', resource);
      }

      if (action) {
        query = query.eq('action', action);
      }

      const { data: logsData, error: logsError } = await query;

      if (logsError) throw logsError;

      if (!logsData || logsData.length === 0) {
        if (!append) {
          setLogs([]);
        }
        setHasMore(false);
        return;
      }

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set(logsData.map(log => log.user_id))];

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      const logsWithUserNames: AuditLogEntry[] = logsData.map(log => ({
        ...log,
        details: log.details as Record<string, unknown> | null,
        user_name: profileMap.get(log.user_id) || 'Usuário desconhecido',
      }));

      if (append) {
        setLogs(prev => [...prev, ...logsWithUserNames]);
      } else {
        setLogs(logsWithUserNames);
      }

      setHasMore(logsData.length === limit);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [limit, resource, action]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchLogs(logs.length, true);
    }
  }, [fetchLogs, logs.length, loading, hasMore]);

  const refresh = useCallback(() => {
    fetchLogs(0, false);
  }, [fetchLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
