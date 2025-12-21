import { Order, OrderStatus } from '@/types';
import { CompactOrderCard } from './CompactOrderCard';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderColumnProps {
  status: OrderStatus;
  title: string;
  orders: Order[];
  onUpdateStatus: (orderId: string) => void;
}

const headerColors: Record<string, string> = {
  pending: 'kanban-header-pending',
  preparing: 'kanban-header-preparing',
  ready: 'kanban-header-ready',
  out_for_delivery: 'kanban-header-delivering',
};

const headerIcons: Record<string, string> = {
  pending: '🔔',
  preparing: '👨‍🍳',
  ready: '✅',
  out_for_delivery: '🛵',
};

export function OrderColumn({ status, title, orders, onUpdateStatus }: OrderColumnProps) {
  const bgColorClass = headerColors[status] || 'bg-muted';

  return (
    <div className="flex flex-col min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
      {/* Column Header */}
      <div className={cn('rounded-t-xl p-3 flex items-center justify-between', bgColorClass)}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{headerIcons[status]}</span>
          <h3 className="text-white font-bold text-sm uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <span className="bg-white/20 text-white text-sm font-bold rounded-full px-2.5 py-0.5 min-w-[28px] text-center">
          {orders.length}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 bg-card/30 border border-t-0 border-border/30 rounded-b-xl p-2 space-y-2 min-h-[300px]">
        {orders.length > 0 ? (
          orders.map((order) => (
            <CompactOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-muted'
            )}>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Nenhum pedido</p>
          </div>
        )}
      </div>
    </div>
  );
}
