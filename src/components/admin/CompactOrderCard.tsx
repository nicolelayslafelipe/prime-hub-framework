import { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ChevronRight, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CompactOrderCardProps {
  order: Order;
  onUpdateStatus?: (orderId: string) => void;
}

const statusBarColors: Record<OrderStatus, string> = {
  pending: 'bg-status-pending',
  waiting_payment: 'bg-warning',
  confirmed: 'bg-status-preparing',
  preparing: 'bg-status-preparing',
  ready: 'bg-status-ready',
  out_for_delivery: 'bg-status-delivering',
  delivered: 'bg-status-completed',
  cancelled: 'bg-status-cancelled',
};

const actionLabels: Partial<Record<OrderStatus, string>> = {
  pending: 'Aceitar Pedido',
  preparing: 'Marcar Pronto',
  ready: 'Enviar Entrega',
  out_for_delivery: 'Finalizar',
};

export function CompactOrderCard({ order, onUpdateStatus }: CompactOrderCardProps) {
  const timeAgo = formatDistanceToNow(order.createdAt, {
    addSuffix: false,
    locale: ptBR,
  });

  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsPreview = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.productName}`)
    .join(', ');
  const hasMoreItems = order.items.length > 2;

  const isUrgent = order.status === 'pending';

  return (
    <div
      className={cn(
        'relative bg-card border border-border/50 rounded-xl overflow-hidden transition-all duration-200',
        'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
        isUrgent && 'animate-pulse-subtle'
      )}
    >
      {/* Status bar at top */}
      <div className={cn('h-1.5 w-full', statusBarColors[order.status])} />

      <div className="p-3 space-y-3">
        {/* Header: Order number + Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-black font-mono text-primary">
            #{order.orderNumber}
          </span>
          <span className="text-lg font-black text-foreground">
            R$ {order.total.toFixed(2)}
          </span>
        </div>

        {/* Customer info */}
        <div className="space-y-1.5">
          <p className="font-semibold text-sm text-foreground truncate">
            {order.customerName}
          </p>
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{order.customerAddress}</span>
          </div>
        </div>

        {/* Items preview */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-2">
          <p className="truncate">
            {itemsPreview}
            {hasMoreItems && ` +${order.items.length - 2}`}
          </p>
        </div>

        {/* Time + item count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
        </div>

        {/* Change info if needed */}
        {order.needsChange && order.changeAmount !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-accent bg-accent/10 rounded-lg px-2.5 py-1.5">
            <Coins className="h-3 w-3" />
            <span className="font-medium">Troco: R$ {order.changeAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Notes if any */}
        {order.notes && (
          <div className="text-xs text-warning bg-warning/10 rounded-lg px-2.5 py-1.5 truncate">
            📝 {order.notes}
          </div>
        )}

        {/* Action button */}
        {onUpdateStatus && actionLabels[order.status] && (
          <Button
            onClick={() => onUpdateStatus(order.id)}
            size="sm"
            className="w-full h-9 font-semibold group"
          >
            {actionLabels[order.status]}
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
}
