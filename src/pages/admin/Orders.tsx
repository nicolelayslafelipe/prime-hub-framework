import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOrders } from '@/contexts/OrderContext';
import { useSound } from '@/contexts/SoundContext';
import { OrderColumn } from '@/components/admin/OrderColumn';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { SoundIndicator } from '@/components/shared/SoundIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatus } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';

const columns: { status: OrderStatus; title: string }[] = [
  { status: 'pending', title: 'Pendentes' },
  { status: 'preparing', title: 'Preparando' },
  { status: 'ready', title: 'Prontos' },
  { status: 'out_for_delivery', title: 'Em Entrega' },
];

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  waiting_payment: 'pending',
  pending: 'preparing',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  cancelled: null,
};

function ColumnSkeleton() {
  return (
    <div className="flex flex-col min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
      <Skeleton className="h-12 rounded-t-xl rounded-b-none" />
      <div className="flex-1 bg-card/30 border border-t-0 border-border/30 rounded-b-xl p-2 space-y-2 min-h-[300px]">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { orders, updateOrderStatus, getOrdersByStatus, isLoading, connectionStatus } = useOrders();
  const { adminSettings, isPlayingAdmin } = useSound();
  
  // Track recently moved orders for animation
  const [recentlyMovedOrders, setRecentlyMovedOrders] = useState<Set<string>>(new Set());
  const previousOrderStatusRef = useRef<Map<string, OrderStatus>>(new Map());

  // Detect status changes and mark orders as recently moved
  useEffect(() => {
    const newRecentlyMoved = new Set<string>();
    
    orders.forEach((order) => {
      const previousStatus = previousOrderStatusRef.current.get(order.id);
      if (previousStatus && previousStatus !== order.status) {
        newRecentlyMoved.add(order.id);
      }
      previousOrderStatusRef.current.set(order.id, order.status);
    });
    
    if (newRecentlyMoved.size > 0) {
      setRecentlyMovedOrders((prev) => new Set([...prev, ...newRecentlyMoved]));
      
      // Clear the animation after 2.5 seconds
      setTimeout(() => {
        setRecentlyMovedOrders((prev) => {
          const updated = new Set(prev);
          newRecentlyMoved.forEach((id) => updated.delete(id));
          return updated;
        });
      }, 2500);
    }
  }, [orders]);

  const handleUpdateStatus = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && statusFlow[order.status]) {
      await updateOrderStatus(orderId, statusFlow[order.status]!);
    }
  }, [orders, updateOrderStatus]);

  return (
    <AdminLayout 
      title="Pedidos" 
      subtitle="Gestão de pedidos em tempo real"
      headerRight={
        <div className="flex items-center gap-3">
          <SoundIndicator 
            isPlaying={isPlayingAdmin} 
            isEnabled={adminSettings?.enabled ?? true}
            size="md"
          />
          <ConnectionStatus status={connectionStatus} />
        </div>
      }
    >
      {/* Responsive container: horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible scrollbar-thin">
        {isLoading ? (
          <>
            <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton />
          </>
        ) : (
          columns.map((column) => (
            <OrderColumn
              key={column.status}
              status={column.status}
              title={column.title}
              orders={getOrdersByStatus(column.status)}
              onUpdateStatus={handleUpdateStatus}
              recentlyMovedOrders={recentlyMovedOrders}
            />
          ))
        )}
      </div>
    </AdminLayout>
  );
}
