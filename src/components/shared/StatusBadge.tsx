import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-status-pending/20 text-status-pending border-status-pending/30',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-status-preparing/20 text-status-preparing border-status-preparing/30',
  },
  preparing: {
    label: 'Preparando',
    className: 'bg-status-preparing/20 text-status-preparing border-status-preparing/30',
  },
  ready: {
    label: 'Pronto',
    className: 'bg-status-ready/20 text-status-ready border-status-ready/30',
  },
  out_for_delivery: {
    label: 'Em Entrega',
    className: 'bg-status-delivering/20 text-status-delivering border-status-delivering/30',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-status-completed/20 text-status-completed border-status-completed/30',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/30',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.className,
        sizeClasses[size]
      )}
    >
      {config.label}
    </span>
  );
}
