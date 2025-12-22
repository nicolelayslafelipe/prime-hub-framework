import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useIntegrationStatus, IntegrationStatus, IntegrationLog } from '@/hooks/useIntegrationStatus';
import { supabase } from '@/integrations/supabase/client';

interface IntegrationsContextType {
  integrations: IntegrationStatus[];
  logs: IntegrationLog[];
  isLoading: boolean;
  error: string | null;
  hasErrors: boolean;
  getIntegration: (key: string) => IntegrationStatus | undefined;
  refetch: () => Promise<void>;
  checkHealth: () => Promise<void>;
}

const emptyContext: IntegrationsContextType = {
  integrations: [],
  logs: [],
  isLoading: false,
  error: null,
  hasErrors: false,
  getIntegration: () => undefined,
  refetch: async () => {},
  checkHealth: async () => {},
};

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const integrationStatus = useIntegrationStatus();

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setIsAdmin(false);
          return;
        }

        const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userData.user.id });
        setIsAdmin(roleData === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Return empty context for non-admins to prevent unnecessary data exposure
  const value = isAdmin ? integrationStatus : emptyContext;

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error('useIntegrations must be used within an IntegrationsProvider');
  }
  return context;
}
