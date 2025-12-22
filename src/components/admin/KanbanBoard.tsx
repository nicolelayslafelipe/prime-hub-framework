import { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanColumn {
  id: OrderStatus;
  title: string;
  color: string;
}

const columns: KanbanColumn[] = [
  { id: 'pending', title: 'Novo', color: 'bg-status-pending' },
  { id: 'confirmed', title: 'Confirmado', color: 'bg-blue-500' },
  { id: 'preparing', title: 'Em Preparo', color: 'bg-status-preparing' },
  { id: 'ready', title: 'Pronto', color: 'bg-status-ready' },
  { id: 'out_for_delivery', title: 'Saiu para Entrega', color: 'bg-purple-500' },
  { id: 'delivered', title: 'Entregue', color: 'bg-status-delivered' },
  { id: 'cancelled', title: 'Cancelado', color: 'bg-status-cancelled' },
];

interface KanbanBoardProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onViewOrder?: (order: Order) => void;
}

export function KanbanBoard({ orders, onUpdateStatus, onViewOrder }: KanbanBoardProps) {
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null);

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  };

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', order.id);
  };

  const handleDragOver = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== newStatus) {
      onUpdateStatus(draggedOrder.id, newStatus);
    }
    setDraggedOrder(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDragOverColumn(null);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {columns.map((column) => {
          const columnOrders = getOrdersByStatus(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                'w-80 flex-shrink-0 rounded-xl border bg-card/50 transition-all duration-200',
                isOver && 'ring-2 ring-primary border-primary bg-primary/5'
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <span className={cn('h-3 w-3 rounded-full', column.color)} />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium">
                  {columnOrders.length}
                </span>
              </div>

              {/* Column Content */}
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-3 space-y-3">
                  {columnOrders.length === 0 ? (
                    <div className={cn(
                      'flex items-center justify-center h-24 rounded-lg border-2 border-dashed text-muted-foreground text-sm transition-colors',
                      isOver && 'border-primary text-primary'
                    )}>
                      {isOver ? 'Soltar aqui' : 'Nenhum pedido'}
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <KanbanCard
                        key={order.id}
                        order={order}
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onViewOrder?.(order)}
                        isDragging={draggedOrder?.id === order.id}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
