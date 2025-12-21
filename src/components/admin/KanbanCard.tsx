import { Order } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, CreditCard, MapPin, GripVertical, Monitor, Store, Package, UtensilsCrossed } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface KanbanCardProps {
  order: Order;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick?: () => void;
  isDragging?: boolean;
}

const getOrderTypeInfo = (orderType?: string) => {
  switch (orderType) {
    case 'pdv_counter':
      return { label: 'Balcão', icon: Store, color: 'bg-accent text-accent-foreground' };
    case 'pdv_pickup':
      return { label: 'Retirada', icon: Package, color: 'bg-primary text-primary-foreground' };
    case 'pdv_table':
      return { label: 'Mesa', icon: UtensilsCrossed, color: 'bg-orange-500 text-white' };
    default:
      return null;
  }
};

export function KanbanCard({
  order,
  onDragStart,
  onDragEnd,
  onClick,
  isDragging,
}: KanbanCardProps) {
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const isPDV = order.orderType?.startsWith('pdv_');
  const orderTypeInfo = getOrderTypeInfo(order.orderType);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'group relative rounded-lg border bg-card p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:border-primary/30',
        isDragging && 'opacity-50 scale-95 rotate-2'
      )}
    >
      {/* Drag Handle */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Order Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-primary">#{order.orderNumber}</p>
            {isPDV && orderTypeInfo && (
              <Badge className={cn('text-[10px] px-1.5 py-0 h-5', orderTypeInfo.color)}>
                <orderTypeInfo.icon className="h-3 w-3 mr-1" />
                {orderTypeInfo.label}
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">{order.customerName}</p>
          {order.orderType === 'pdv_table' && order.tableNumber && (
            <p className="text-xs text-muted-foreground">Mesa {order.tableNumber}</p>
          )}
        </div>
        <span className="text-lg font-bold text-accent">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      {/* Order Info */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5" />
          <span>{order.paymentMethod}</span>
        </div>
        {!isPDV && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{order.customerAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {order.items.slice(0, 3).map((item, idx) => (
            <span
              key={idx}
              className="text-xs bg-muted px-2 py-0.5 rounded-full"
            >
              {item.quantity}x {item.productName.split(' ')[0]}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              +{order.items.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
