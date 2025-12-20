import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOrders } from '@/contexts/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/admin/OrderCard';
import { OrderStatus } from '@/types';

const columns: { status: OrderStatus; title: string; color: string }[] = [
  { status: 'pending', title: 'Pendentes', color: 'bg-status-pending' },
  { status: 'preparing', title: 'Preparando', color: 'bg-status-preparing' },
  { status: 'ready', title: 'Prontos', color: 'bg-status-ready' },
  { status: 'out_for_delivery', title: 'Em Entrega', color: 'bg-status-delivering' },
];

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  cancelled: null,
};

export default function AdminOrders() {
  const { orders, updateOrderStatus, getOrdersByStatus } = useOrders();

  const handleUpdateStatus = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && statusFlow[order.status]) {
      updateOrderStatus(orderId, statusFlow[order.status]!);
    }
  };

  return (
    <AdminLayout title="Pedidos" subtitle="Gestão de pedidos em tempo real">
      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-4">
        {columns.map((column) => {
          const columnOrders = getOrdersByStatus(column.status);
          return (
            <div key={column.status} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold">{column.title}</h3>
                </div>
                <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
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
                    />
                  ))
                ) : (
                  <Card className="p-6 glass border-dashed text-center">
                    <p className="text-sm text-muted-foreground">Nenhum pedido</p>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
