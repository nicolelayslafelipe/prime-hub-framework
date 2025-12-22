import { useEffect, useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Logo } from '@/components/shared/Logo';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { SoundIndicator } from '@/components/shared/SoundIndicator';
import { OrderDetailsModal } from '@/components/shared/OrderDetailsModal';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Order, OrderStatus } from '@/types';
import { Clock, ChefHat, CheckCircle2, Coins, VolumeX, LogOut, User, Eye, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const kitchenStatuses: OrderStatus[] = ['pending', 'preparing', 'ready'];

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  waiting_payment: null,
  pending: 'preparing',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: null,
  out_for_delivery: null,
  delivered: null,
  cancelled: null,
};

const statusActions: Record<OrderStatus, string> = {
  waiting_payment: '',
  pending: 'Iniciar Preparo',
  preparing: 'Marcar Pronto',
  ready: 'Aguardando Entrega',
  confirmed: 'Iniciar Preparo',
  out_for_delivery: '',
  delivered: '',
  cancelled: '',
};

function OrderCardSkeleton() {
  return (
    <Card className="p-4 glass">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </Card>
  );
}

export default function KitchenPanel() {
  const { orders, updateOrderStatus, deleteOrder, isLoading, connectionStatus } = useOrders();
  const { 
    kitchenSettings, 
    isPlayingKitchen, 
    isKitchenRepeating, 
    stopKitchenRepeat,
    markOrderAsAlerted,
    initializeAudio,
    isAudioInitialized,
  } = useSound();
  const { profile, signOut } = useAuth();
  const { logOrderAction } = useAuditLog();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleModalUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    stopKitchenRepeat();
    markOrderAsAlerted(orderId);
    await updateOrderStatus(orderId, newStatus);
    setIsModalOpen(false);
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    if (isAudioInitialized) return;

    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initializeAudio, isAudioInitialized]);

  const kitchenOrders = orders.filter((order) =>
    kitchenStatuses.includes(order.status)
  );

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };


  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = statusFlow[currentStatus];
    if (nextStatus) {
      // Stop repeat and mark as handled when interacting with order
      stopKitchenRepeat();
      markOrderAsAlerted(orderId);
      await updateOrderStatus(orderId, nextStatus);
    }
  };

  // Handle delete order (only for cancelled orders)
  const handleDeleteRequest = (order: Order) => {
    if (order.status === 'cancelled') {
      setOrderToDelete(order);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteOrder(orderToDelete.id);
      await logOrderAction('delete_order', orderToDelete.id, orderToDelete.orderNumber, {
        deletedBy: 'kitchen',
        status: orderToDelete.status,
      });
      toast.success(`Pedido #${orderToDelete.orderNumber} excluído`);
      setOrderToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir pedido');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <span className="font-semibold">Painel da Cozinha</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isKitchenRepeating && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={stopKitchenRepeat}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <VolumeX className="h-4 w-4 mr-2" />
                Parar Alerta
              </Button>
            )}
            <SoundIndicator 
              isPlaying={isPlayingKitchen} 
              isEnabled={kitchenSettings?.enabled ?? true}
              isRepeating={isKitchenRepeating}
              size="md"
            />
            <div className="text-sm text-muted-foreground">
              {kitchenOrders.length} pedidos em andamento
            </div>
            <ConnectionStatus status={connectionStatus} />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{profile?.name || 'Cozinha'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`h-3 w-3 rounded-full bg-status-pending ${pendingCount > 0 && isKitchenRepeating ? 'animate-pulse' : ''}`} />
              <h2 className="text-lg font-semibold">Novos Pedidos</h2>
              <span className={`text-sm bg-secondary px-2 py-0.5 rounded-full ${pendingCount > 0 ? 'text-status-pending font-bold' : 'text-muted-foreground'}`}>
                {pendingCount}
              </span>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <OrderCardSkeleton />
                  <OrderCardSkeleton />
                </>
              ) : (
                orders
                  .filter((o) => o.status === 'pending')
                  .map((order) => (
                    <Card key={order.id} className="p-4 glass animate-fade-in border-l-4 border-l-status-pending">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold">#{order.orderNumber}</span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewOrder(order)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <StatusBadge status={order.status} size="lg" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                            <span className="text-lg font-bold text-primary">{item.quantity}x</span>
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="bg-warning/10 rounded-lg px-3 py-2 mb-4">
                          <p className="text-sm text-warning font-medium">Obs: {order.notes}</p>
                        </div>
                      )}
                      {order.needsChange && order.changeFor && order.changeAmount !== undefined && (
                        <div className="bg-accent/10 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                          <Coins className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium text-accent">
                            Troco: R$ {order.changeAmount.toFixed(2)} (paga R$ {order.changeFor.toFixed(2)})
                          </span>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                      >
                        {statusActions[order.status]}
                      </Button>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* Preparing */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-status-preparing animate-pulse" />
              <h2 className="text-lg font-semibold">Preparando</h2>
              <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {orders.filter((o) => o.status === 'preparing').length}
              </span>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <OrderCardSkeleton />
                </>
              ) : (
                orders
                  .filter((o) => o.status === 'preparing')
                  .map((order) => (
                    <Card key={order.id} className="p-4 glass animate-fade-in border-l-4 border-l-status-preparing">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold">#{order.orderNumber}</span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewOrder(order)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <StatusBadge status={order.status} size="lg" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                            <span className="text-lg font-bold text-primary">{item.quantity}x</span>
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full bg-success hover:bg-success/90"
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {statusActions[order.status]}
                      </Button>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* Ready */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-status-ready" />
              <h2 className="text-lg font-semibold">Prontos</h2>
              <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {orders.filter((o) => o.status === 'ready').length}
              </span>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <OrderCardSkeleton />
                </>
              ) : (
                orders
                  .filter((o) => o.status === 'ready')
                  .map((order) => (
                    <Card key={order.id} className="p-4 glass animate-fade-in border-l-4 border-l-status-ready">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-2xl font-bold">#{order.orderNumber}</span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewOrder(order)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <StatusBadge status={order.status} size="lg" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                            <span className="text-lg font-bold text-primary">{item.quantity}x</span>
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-success/10 rounded-lg px-3 py-2 text-center">
                        <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Aguardando retirada
                        </p>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdateStatus={handleModalUpdateStatus}
        showActions={true}
      />
      
      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Excluir Pedido #${orderToDelete?.orderNumber}`}
        description="Somente pedidos cancelados podem ser excluídos pela cozinha. Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </div>
  );
}
