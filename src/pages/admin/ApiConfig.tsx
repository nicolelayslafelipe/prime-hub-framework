import { AdminLayout } from '@/components/admin/AdminLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Key, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useApiIntegrations } from '@/hooks/useApiIntegrations';

export default function AdminApiConfig() {
  const { integrations, isLoading, isSaving, toggleIntegration } = useApiIntegrations();

  if (isLoading) {
    return (
      <AdminLayout title="Configuração API" subtitle="Gerencie integrações externas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuração API" subtitle="Gerencie integrações externas">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Key className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground">Status das integrações do sistema</span>
        </div>

        {integrations.map(integration => (
          <div key={integration.id} className="card-premium p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-semibold">{integration.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${integration.environment === 'production' ? 'bg-accent/20 text-accent' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {integration.environment === 'production' ? 'Produção' : 'Teste'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {integration.status === 'connected' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-accent">Conectado</span>
                  </>
                )}
                {integration.status === 'error' && (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Erro</span>
                  </>
                )}
                {integration.status === 'disconnected' && (
                  <span className="text-sm text-muted-foreground">Desconectado</span>
                )}
              </div>
            </div>
            <Switch 
              checked={integration.is_active} 
              onCheckedChange={() => toggleIntegration(integration.id)}
              disabled={isSaving}
            />
            <Button variant="ghost" size="icon" disabled={isSaving}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
