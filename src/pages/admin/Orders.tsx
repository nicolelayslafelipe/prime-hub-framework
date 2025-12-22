import { AdminLayout } from '@/components/admin/AdminLayout';
import { useOrders } from '@/contexts/OrderContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { DraggableOrderColumn } from '@/components/admin/DraggableOrderColumn';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { SoundIndicator } from '@/components/shared/SoundIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatus, Order } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const columns: { status: OrderStatus; title: string }[] = [
  { status: 'pending', title: 'Pendentes' },
  { status: 'preparing', title: 'Preparando' },
  { status: 'ready', title: 'Prontos' },
  { status: 'out_for_delivery', title: 'Em Entrega' },
];

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
  const { orders, updateOrderStatus, deleteOrder, getOrdersByStatus, isLoading, connectionStatus } = useOrders();
  const { adminSettings, isPlayingAdmin } = useSound();
  const { logOrderAction } = useAuditLog();
  
  // Track recently moved orders for animation
  const [recentlyMovedOrders, setRecentlyMovedOrders] = useState<Set<string>>(new Set());
  const previousOrderStatusRef = useRef<Map<string, OrderStatus>>(new Map());

  // Drag and drop state
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null);
  
  // Delete state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!order) return;

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

    if (statusFlow[order.status]) {
      await updateOrderStatus(orderId, statusFlow[order.status]!);
    }
  }, [orders, updateOrderStatus]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Get the dragged order from dataTransfer
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setDraggedOrder(order);
      }
    }
    
    setDragOverColumn(status);
  }, [orders]);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    
    const orderId = e.dataTransfer.getData('text/plain');
    const order = orders.find(o => o.id === orderId);
    
    if (order && order.status !== newStatus) {
      try {
        await updateOrderStatus(order.id, newStatus);
        toast.success(`Pedido #${order.orderNumber} movido para ${columns.find(c => c.status === newStatus)?.title}`);
      } catch (error) {
        toast.error('Erro ao mover pedido');
      }
    }
    
    setDraggedOrder(null);
    setDragOverColumn(null);
  }, [orders, updateOrderStatus]);

  // Handle delete order
  const handleDeleteRequest = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setOrderToDelete(order);
    }
  }, [orders]);

  const handleConfirmDelete = useCallback(async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteOrder(orderToDelete.id);
      await logOrderAction('delete_order', orderToDelete.id, orderToDelete.orderNumber, {
        status: orderToDelete.status,
        total: orderToDelete.total,
      });
      toast.success(`Pedido #${orderToDelete.orderNumber} excluído com sucesso`);
      setOrderToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir pedido');
    } finally {
      setIsDeleting(false);
    }
  }, [orderToDelete, deleteOrder, logOrderAction]);

  return (
    <AdminLayout 
      title="Pedidos" 
      subtitle="Gestão de pedidos em tempo real • Arraste para mover"
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
            <DraggableOrderColumn
              key={column.status}
              status={column.status}
              title={column.title}
              orders={getOrdersByStatus(column.status)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteOrder={handleDeleteRequest}
              recentlyMovedOrders={recentlyMovedOrders}
              isDragOver={dragOverColumn === column.status}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            />
          ))
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Excluir Pedido #${orderToDelete?.orderNumber}`}
        description={`Tem certeza que deseja excluir o pedido #${orderToDelete?.orderNumber}? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
