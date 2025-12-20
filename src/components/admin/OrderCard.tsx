import { Order } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Phone, User, ChevronRight, Utensils, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (orderId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

export function OrderCard({ 
  order, 
  onUpdateStatus, 
  showActions = true,
  variant = 'default'
}: OrderCardProps) {
  const timeAgo = formatDistanceToNow(order.createdAt, {
    addSuffix: true,
    locale: ptBR,
  });

  const isUrgent = order.status === 'pending';

  return (
    <div 
      className={cn(
        'group relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden transition-all duration-300',
        'hover:border-primary/30 hover:shadow-[0_0_40px_-15px_hsl(var(--primary)/0.3)]',
        isUrgent && 'border-status-pending/30 animate-glow-pulse',
        variant === 'compact' ? 'p-4' : 'p-5'
      )}
    >
      {/* Urgent indicator */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-status-pending via-neon-orange to-status-pending animate-gradient" 
          style={{ backgroundSize: '200% 100%' }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-mono gradient-text">
              #{order.orderNumber}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-foreground">
            R$ {order.total.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            {order.items.reduce((acc, item) => acc + item.quantity, 0)} itens
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-2.5 mb-4 p-3 rounded-xl bg-muted/30 border border-border/30">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {order.customerPhone}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-accent" />
          <span className="line-clamp-2">{order.customerAddress}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Utensils className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Itens do pedido
          </span>
        </div>
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <div 
              key={item.id} 
              className="flex justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">{item.quantity}x</span>
                <span>{item.productName}</span>
              </span>
              <span className="font-medium text-muted-foreground">
                R$ {(item.quantity * item.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-xs font-semibold text-warning flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
            Obs: {order.notes}
          </p>
        </div>
      )}

      {/* Change Info */}
      {order.needsChange && order.changeFor && order.changeAmount !== undefined && (
        <div className="mb-4 p-3 rounded-xl bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2 text-accent">
            <Coins className="h-4 w-4" />
            <span className="text-xs font-semibold">TROCO</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Pagará com:</span>
            <span className="font-bold">R$ {order.changeFor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Troco:</span>
            <span className="font-bold text-accent">R$ {order.changeAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && onUpdateStatus && (
        <Button
          onClick={() => onUpdateStatus(order.id)}
          className="w-full group/btn gradient-primary text-primary-foreground font-semibold h-12 rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300"
        >
          <span>Avançar Status</span>
          <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      )}
    </div>
  );
}
