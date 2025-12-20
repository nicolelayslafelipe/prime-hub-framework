import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { icon: React.ElementType; label: string; color: string }> = {
  connecting: {
    icon: Loader2,
    label: 'Conectando...',
    color: 'bg-warning/20 text-warning',
  },
  connected: {
    icon: Wifi,
    label: 'Tempo real',
    color: 'bg-success/20 text-success',
  },
  disconnected: {
    icon: WifiOff,
    label: 'Desconectado',
    color: 'bg-destructive/20 text-destructive',
  },
  error: {
    icon: WifiOff,
    label: 'Erro de conexão',
    color: 'bg-destructive/20 text-destructive',
  },
};

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        config.color,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'connecting' && 'animate-spin')} />
      <span>{config.label}</span>
      {status === 'connected' && (
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
      )}
    </div>
  );
}
