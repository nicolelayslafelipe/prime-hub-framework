import { Order } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, CreditCard, MapPin, GripVertical, Store, Package, UtensilsCrossed, Eye, Coins, FileText } from 'lucide-react';
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

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when dragging
    if (e.defaultPrevented) return;
    onClick?.();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      className={cn(
        'group relative rounded-lg border bg-card p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:border-primary/30',
        isDragging && 'opacity-50 scale-95 rotate-2',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Drag Handle & View Icon */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onClick && (
          <div className="p-1 rounded hover:bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Order Header */}
      <div className="flex items-start justify-between mb-3 pr-16">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-lg text-primary">#{order.orderNumber}</p>
            {isPDV && orderTypeInfo && (
              <Badge className={cn('text-[10px] px-1.5 py-0 h-5', orderTypeInfo.color)}>
                <orderTypeInfo.icon className="h-3 w-3 mr-1" />
                {orderTypeInfo.label}
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium truncate">{order.customerName}</p>
          {order.orderType === 'pdv_table' && order.tableNumber && (
            <p className="text-xs text-muted-foreground">Mesa {order.tableNumber}</p>
          )}
        </div>
        <span className="text-lg font-bold text-accent whitespace-nowrap">
          R$ {order.total.toFixed(2)}
        </span>
      </div>

      {/* Order Info */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{order.paymentMethod}</span>
        </div>
        {!isPDV && order.customerAddress && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate" title={order.customerAddress}>{order.customerAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Change Info */}
      {order.needsChange && order.changeFor && order.changeAmount !== undefined && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-accent/10 rounded px-2 py-1">
          <Coins className="h-3 w-3 text-accent" />
          <span className="text-accent font-medium">
            Troco: R$ {order.changeAmount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Notes Preview */}
      {order.notes && (
        <div className="mt-2 flex items-start gap-2 text-xs bg-warning/10 rounded px-2 py-1">
          <FileText className="h-3 w-3 text-warning flex-shrink-0 mt-0.5" />
          <span className="text-warning line-clamp-2">{order.notes}</span>
        </div>
      )}

      {/* Items Preview */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {order.items.slice(0, 3).map((item, idx) => (
            <span
              key={idx}
              className="text-xs bg-muted px-2 py-0.5 rounded-full truncate max-w-full"
              title={item.productName}
            >
              {item.quantity}x {item.productName}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              +{order.items.length - 3} mais
            </span>
          )}
        </div>
      </div>

      {/* Click hint */}
      {onClick && (
        <div className="mt-3 text-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Clique para ver detalhes
        </div>
      )}
    </div>
  );
}
