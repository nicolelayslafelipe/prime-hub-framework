import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { OrderDetailsModal } from '@/components/shared/OrderDetailsModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/contexts/OrderContext';
import { Order, OrderStatus } from '@/types';

export default function AdminKanban() {
  const { orders, updateOrderStatus, isLoading, connectionStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
    setIsModalOpen(false);
  };

  return (
    <AdminLayout 
      title="Kanban" 
      subtitle="Gerencie pedidos arrastando entre colunas"
      headerRight={<ConnectionStatus status={connectionStatus} />}
    >
      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-72 flex-shrink-0">
              <Skeleton className="h-12 w-full mb-3" />
              <Skeleton className="h-32 w-full mb-2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          orders={orders}
          onUpdateStatus={handleUpdateStatus}
          onViewOrder={handleViewOrder}
        />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdateStatus={handleModalUpdateStatus}
        showActions={true}
      />
    </AdminLayout>
  );
}
