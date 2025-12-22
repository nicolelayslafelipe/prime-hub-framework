import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useIntegrationStatus } from '@/hooks/useIntegrationStatus';

export function IntegrationAlertBanner() {
  const { integrations, hasErrors } = useIntegrationStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!hasErrors || isDismissed) return null;

  const errorIntegrations = integrations.filter(i => i.status === 'error' && i.is_active);

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
      <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            {errorIntegrations.length === 1 
              ? `A integração ${errorIntegrations[0].integration_name} está com problemas`
              : `${errorIntegrations.length} integrações estão com problemas`
            }
          </span>
          <Link to="/admin/integration-status">
            <Button variant="link" size="sm" className="text-destructive p-0 h-auto">
              Ver detalhes
            </Button>
          </Link>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
