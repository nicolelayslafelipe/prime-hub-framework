import { AdminLayout } from '@/components/admin/AdminLayout';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { useOrders } from '@/contexts/OrderContext';
import { OrderStatus } from '@/types';

export default function AdminKanban() {
  const { orders, updateOrderStatus } = useOrders();

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <AdminLayout title="Kanban" subtitle="Gerencie pedidos arrastando entre colunas">
      <KanbanBoard
        orders={orders}
        onUpdateStatus={handleUpdateStatus}
      />
    </AdminLayout>
  );
}
