import { Order, OrderStatus } from '@/types';
import { DraggableOrderCard } from './DraggableOrderCard';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DraggableOrderColumnProps {
  status: OrderStatus;
  title: string;
  orders: Order[];
  onUpdateStatus: (orderId: string) => void;
  recentlyMovedOrders?: Set<string>;
  isDragOver?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
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

export function DraggableOrderColumn({ 
  status, 
  title, 
  orders, 
  onUpdateStatus,
  recentlyMovedOrders = new Set(),
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: DraggableOrderColumnProps) {
  const bgColorClass = headerColors[status] || 'bg-muted';

  return (
    <motion.div 
      className={cn(
        'flex flex-col min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink'
      )}
      animate={{
        scale: isDragOver ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <motion.div 
        className={cn(
          'rounded-t-xl p-3 flex items-center justify-between',
          bgColorClass
        )}
        animate={{
          boxShadow: isDragOver ? '0 0 20px rgba(var(--primary), 0.3)' : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{headerIcons[status]}</span>
          <h3 className="text-white font-bold text-sm uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <motion.span 
          className="bg-white/20 text-white text-sm font-bold rounded-full px-2.5 py-0.5 min-w-[28px] text-center"
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {orders.length}
        </motion.span>
      </motion.div>

      {/* Column Content */}
      <motion.div 
        className={cn(
          'flex-1 border border-t-0 rounded-b-xl p-2 space-y-2 min-h-[300px]',
          isDragOver 
            ? 'bg-primary/10 border-primary/50' 
            : 'bg-card/30 border-border/30'
        )}
        animate={{
          backgroundColor: isDragOver ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card) / 0.3)',
        }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="popLayout">
          {orders.length > 0 ? (
            orders.map((order) => (
              <DraggableOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={onUpdateStatus}
                isNew={recentlyMovedOrders.has(order.id)}
              />
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex flex-col items-center justify-center py-12 transition-all duration-200',
                isDragOver ? 'opacity-100' : 'opacity-50'
              )}
            >
              {isDragOver ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-primary/20 border-2 border-dashed border-primary mx-auto">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs text-primary font-medium">Soltar aqui</p>
                </motion.div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Nenhum pedido</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
