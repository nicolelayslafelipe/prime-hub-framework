import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Zap,
  History,
  Wallet,
  Map
} from 'lucide-react';
import { useIntegrationStatus, IntegrationStatus as IStatus, IntegrationLog } from '@/hooks/useIntegrationStatus';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const integrationIcons: Record<string, any> = {
  mercadopago: Wallet,
  mapbox: Map
};

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  online: { bg: 'bg-accent/10', text: 'text-accent', icon: CheckCircle },
  error: { bg: 'bg-destructive/10', text: 'text-destructive', icon: XCircle },
  unknown: { bg: 'bg-muted', text: 'text-muted-foreground', icon: AlertCircle }
};

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  health_check: { label: 'Verificação', color: 'default' },
  status_change: { label: 'Mudança de Status', color: 'secondary' },
  error: { label: 'Erro', color: 'destructive' },
  recovery: { label: 'Recuperado', color: 'default' },
  fail_safe_activated: { label: 'Fail-Safe Ativado', color: 'destructive' },
  fail_safe_deactivated: { label: 'Fail-Safe Desativado', color: 'default' }
};

function IntegrationCard({ integration }: { integration: IStatus }) {
  const Icon = integrationIcons[integration.integration_key] || Activity;
  const statusConfig = statusColors[integration.status] || statusColors.unknown;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="card-premium">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-lg', statusConfig.bg)}>
              <Icon className={cn('h-5 w-5', statusConfig.text)} />
            </div>
            <div>
              <CardTitle className="text-base">{integration.integration_name}</CardTitle>
              <CardDescription className="text-xs">
                {integration.integration_key}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={integration.is_active ? 'default' : 'secondary'}
              className="text-xs"
            >
              {integration.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md', statusConfig.bg)}>
              <StatusIcon className={cn('h-3.5 w-3.5', statusConfig.text)} />
              <span className={cn('text-xs font-medium capitalize', statusConfig.text)}>
                {integration.status === 'online' ? 'Online' : 
                 integration.status === 'error' ? 'Erro' : 'Desconhecido'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Última verificação
            </div>
            <p className="text-sm font-medium">
              {integration.last_check 
                ? formatDistanceToNow(new Date(integration.last_check), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })
                : 'Nunca'}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              Latência
            </div>
            <p className="text-sm font-medium">
              {integration.latency_ms !== null ? `${integration.latency_ms}ms` : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Último sucesso
            </div>
            <p className="text-sm font-medium">
              {integration.last_success 
                ? formatDistanceToNow(new Date(integration.last_success), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })
                : 'Nunca'}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <XCircle className="h-3 w-3" />
              Erros consecutivos
            </div>
            <p className={cn(
              'text-sm font-medium',
              integration.error_count > 0 && 'text-destructive'
            )}>
              {integration.error_count}
            </p>
          </div>
        </div>

        {integration.status === 'error' && integration.error_message && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{integration.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LogEntry({ log }: { log: IntegrationLog }) {
  const eventConfig = eventTypeLabels[log.event_type] || { label: log.event_type, color: 'default' };
  
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0 mt-0.5">
        <History className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={eventConfig.color as any} className="text-xs">
            {eventConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {log.integration_key}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.created_at), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </span>
        </div>
        {log.message && (
          <p className="text-sm text-foreground">{log.message}</p>
        )}
      </div>
    </div>
  );
}

export default function IntegrationStatusPage() {
  const { integrations, logs, isLoading, hasErrors, checkHealth } = useIntegrationStatus();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckHealth = async () => {
    setIsChecking(true);
    await checkHealth();
    setIsChecking(false);
  };

  return (
    <AdminLayout 
      title="Status das Integrações" 
      subtitle="Monitore a saúde das suas integrações em tempo real"
      headerRight={
        <Button 
          onClick={handleCheckHealth} 
          disabled={isChecking}
          variant={hasErrors ? 'destructive' : 'outline'}
          className="gap-2"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Verificar Agora
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Integrações</p>
                  <p className="text-2xl font-bold">{integrations.length}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold text-accent">
                    {integrations.filter(i => i.status === 'online').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Com Erro</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    hasErrors ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {integrations.filter(i => i.status === 'error').length}
                  </p>
                </div>
                <XCircle className={cn(
                  'h-8 w-8',
                  hasErrors ? 'text-destructive' : 'text-muted-foreground'
                )} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Integrações</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </div>

        {/* Logs */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Eventos
            </CardTitle>
            <CardDescription>
              Últimos 50 eventos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum evento registrado ainda
                  </p>
                ) : (
                  logs.map(log => (
                    <LogEntry key={log.id} log={log} />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
