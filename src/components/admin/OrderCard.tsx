import { Order } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Phone, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (orderId: string) => void;
  showActions?: boolean;
}

export function OrderCard({ order, onUpdateStatus, showActions = true }: OrderCardProps) {
  const timeAgo = formatDistanceToNow(order.createdAt, {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="p-4 glass hover:bg-card/90 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold">#{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
        <span className="text-lg font-bold text-primary">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{order.customerPhone}</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{order.customerAddress}</span>
        </div>
      </div>

      <div className="border-t border-border/50 pt-3 mb-3">
        <p className="text-xs text-muted-foreground mb-2">Itens do pedido:</p>
        <div className="space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}x {item.productName}
              </span>
              <span className="text-muted-foreground">
                R$ {(item.quantity * item.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="bg-warning/10 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-warning font-medium">Obs: {order.notes}</p>
        </div>
      )}

      {showActions && onUpdateStatus && (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onUpdateStatus(order.id)}
          >
            Avançar Status
          </Button>
        </div>
      )}
    </Card>
  );
}
