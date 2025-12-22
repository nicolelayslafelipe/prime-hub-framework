import { Order, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, ChevronRight, Coins, GripVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DraggableOrderCardProps {
  order: Order;
  onUpdateStatus?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  isNew?: boolean;
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

export function DraggableOrderCard({ order, onUpdateStatus, onDeleteOrder, isNew = false }: DraggableOrderCardProps) {
  const [showHighlight, setShowHighlight] = useState(isNew);
  const [isDragging, setIsDragging] = useState(false);
  
  // Check if order can be deleted (cancelled or delivered)
  const canDelete = ['cancelled', 'delivered'].includes(order.status);

  // Remove highlight after animation completes
  useEffect(() => {
    if (isNew) {
      setShowHighlight(true);
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

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

  const handleNativeDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ orderId: order.id, currentStatus: order.status }));
    setIsDragging(true);
  };

  const handleNativeDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleNativeDragStart}
      onDragEnd={handleNativeDragEnd}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layout
        layoutId={order.id}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ 
          opacity: isDragging ? 0.5 : 1, 
          scale: isDragging ? 0.95 : 1, 
          y: 0 
        }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          layout: { type: "spring", stiffness: 300, damping: 25 }
        }}
        className={cn(
          'relative bg-card border border-border/50 rounded-xl overflow-hidden',
          'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
          isUrgent && 'animate-pulse-subtle',
          showHighlight && 'ring-2 ring-primary/50 shadow-lg shadow-primary/20',
          isDragging && 'ring-2 ring-primary shadow-xl z-50'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Drag handle indicator */}
        <div className="absolute top-3 right-3 opacity-30 hover:opacity-70 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Status bar at top */}
        <div className={cn('h-1.5 w-full', statusBarColors[order.status])} />

        <div className="p-3 space-y-3">
          {/* Header: Order number + Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-black font-mono text-primary">
              #{order.orderNumber}
            </span>
            <span className="text-lg font-black text-foreground pr-6">
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

          {/* Action buttons */}
          <div className="flex gap-2">
            {onUpdateStatus && actionLabels[order.status] && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(order.id);
                }}
                size="sm"
                className="flex-1 h-9 font-semibold group"
              >
                {actionLabels[order.status]}
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
            
            {/* Delete button for cancelled/delivered orders */}
            {onDeleteOrder && canDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteOrder(order.id);
                }}
                size="sm"
                variant="outline"
                className="h-9 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
