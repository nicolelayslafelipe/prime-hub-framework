import React, { createContext, useContext, ReactNode } from 'react';
import { useIntegrationStatus, IntegrationStatus, IntegrationLog } from '@/hooks/useIntegrationStatus';

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

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const integrationStatus = useIntegrationStatus();

  return (
    <IntegrationsContext.Provider value={integrationStatus}>
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
