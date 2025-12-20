import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOrders } from '@/contexts/OrderContext';
import { useSound } from '@/contexts/SoundContext';
import { OrderCard } from '@/components/admin/OrderCard';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { SoundIndicator } from '@/components/shared/SoundIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatus } from '@/types';
import { Package } from 'lucide-react';

const columns: { status: OrderStatus; title: string }[] = [
  { status: 'pending', title: 'Pendentes' },
  { status: 'preparing', title: 'Preparando' },
  { status: 'ready', title: 'Prontos' },
  { status: 'out_for_delivery', title: 'Em Entrega' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-status-pending',
  preparing: 'bg-status-preparing',
  ready: 'bg-status-ready',
  out_for_delivery: 'bg-status-delivering',
};

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-8" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { orders, updateOrderStatus, getOrdersByStatus, isLoading, connectionStatus } = useOrders();
  const { adminSettings, isPlayingAdmin } = useSound();

  const handleUpdateStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && statusFlow[order.status]) {
      await updateOrderStatus(orderId, statusFlow[order.status]!);
    }
  };

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
      <div className="grid gap-6 lg:grid-cols-4">
        {isLoading ? (
          <>
            <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton />
          </>
        ) : (
          columns.map((column) => {
            const columnOrders = getOrdersByStatus(column.status);
            return (
              <div key={column.status} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColors[column.status]}`} />
                    <h3 className="font-semibold">{column.title}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-md font-medium">
                    {columnOrders.length}
                  </span>
                </div>
                
                <div className="space-y-3 min-h-[200px]">
                  {columnOrders.length > 0 ? (
                    columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={handleUpdateStatus}
                        variant="compact"
                      />
                    ))
                  ) : (
                    <div className="card-premium p-8 text-center border-dashed">
                      <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum pedido</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}
