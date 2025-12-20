import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Truck, 
  Package, 
  XCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<OrderStatus, { 
  label: string; 
  icon: typeof Clock;
  bgClass: string;
  textClass: string;
  glowClass: string;
}> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    bgClass: 'bg-status-pending/15 border-status-pending/30',
    textClass: 'text-status-pending',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--status-pending)/0.5)]',
  },
  confirmed: {
    label: 'Confirmado',
    icon: CheckCircle2,
    bgClass: 'bg-neon-blue/15 border-neon-blue/30',
    textClass: 'text-neon-blue',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--neon-blue)/0.5)]',
  },
  preparing: {
    label: 'Preparando',
    icon: ChefHat,
    bgClass: 'bg-status-preparing/15 border-status-preparing/30',
    textClass: 'text-status-preparing',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--status-preparing)/0.5)]',
  },
  ready: {
    label: 'Pronto',
    icon: Package,
    bgClass: 'bg-status-ready/15 border-status-ready/30',
    textClass: 'text-status-ready',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--status-ready)/0.5)]',
  },
  out_for_delivery: {
    label: 'Em Entrega',
    icon: Truck,
    bgClass: 'bg-status-delivering/15 border-status-delivering/30',
    textClass: 'text-status-delivering',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--status-delivering)/0.5)]',
  },
  delivered: {
    label: 'Entregue',
    icon: CheckCircle2,
    bgClass: 'bg-status-completed/15 border-status-completed/30',
    textClass: 'text-status-completed',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--status-completed)/0.5)]',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    bgClass: 'bg-status-cancelled/15 border-status-cancelled/30',
    textClass: 'text-status-cancelled',
    glowClass: 'shadow-[0_0_20px_-5px_hsl(var(--status-cancelled)/0.5)]',
  },
};

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border transition-all',
        config.bgClass,
        config.textClass,
        config.glowClass,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
