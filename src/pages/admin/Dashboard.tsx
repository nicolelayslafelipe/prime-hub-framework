import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { OrderCard } from '@/components/admin/OrderCard';
import { useConfig } from '@/contexts/ConfigContext';
import { useOrders } from '@/contexts/OrderContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  Store,
  Truck,
} from 'lucide-react';
import { OrderStatus } from '@/types';

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  cancelled: null,
};

export default function AdminDashboard() {
  const { config, toggleEstablishment, toggleDelivery } = useConfig();
  const { orders, updateOrderStatus, getOrdersByStatus } = useOrders();

  const pendingOrders = getOrdersByStatus('pending');
  const preparingOrders = getOrdersByStatus('preparing');

  const todayOrders = orders.length;
  const todayRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const avgDeliveryTime = 32;

  const handleUpdateStatus = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && statusFlow[order.status]) {
      updateOrderStatus(orderId, statusFlow[order.status]!);
    }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Visão geral do estabelecimento">
      {/* Quick Controls */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="p-4 glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.establishment.isOpen ? 'bg-success/20' : 'bg-destructive/20'}`}>
                <Store className={`h-5 w-5 ${config.establishment.isOpen ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="font-medium">Estabelecimento</p>
                <p className="text-sm text-muted-foreground">
                  {config.establishment.isOpen ? 'Aberto para pedidos' : 'Fechado'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.establishment.isOpen}
              onCheckedChange={toggleEstablishment}
            />
          </div>
        </Card>

        <Card className="p-4 glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.establishment.isDeliveryEnabled ? 'bg-primary/20' : 'bg-muted'}`}>
                <Truck className={`h-5 w-5 ${config.establishment.isDeliveryEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {config.establishment.isDeliveryEnabled ? 'Ativo e funcionando' : 'Pausado'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.establishment.isDeliveryEnabled}
              onCheckedChange={toggleDelivery}
            />
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Pedidos Hoje"
          value={todayOrders}
          change={12}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <StatsCard
          title="Receita Hoje"
          value={`R$ ${todayRevenue.toFixed(2)}`}
          change={8}
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="bg-success/10 text-success"
        />
        <StatsCard
          title="Tempo Médio"
          value={`${avgDeliveryTime} min`}
          change={-5}
          icon={<Clock className="h-6 w-6" />}
          iconColor="bg-warning/10 text-warning"
        />
        <StatsCard
          title="Taxa de Conclusão"
          value="98%"
          change={2}
          icon={<TrendingUp className="h-6 w-6" />}
          iconColor="bg-primary/10 text-primary"
        />
      </div>

      {/* Orders Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-status-pending animate-pulse" />
              Pedidos Pendentes
              <span className="text-sm text-muted-foreground">({pendingOrders.length})</span>
            </h2>
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </div>
          <div className="space-y-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            ) : (
              <Card className="p-8 glass text-center">
                <p className="text-muted-foreground">Nenhum pedido pendente</p>
              </Card>
            )}
          </div>
        </div>

        {/* Preparing Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-status-preparing animate-pulse" />
              Em Preparação
              <span className="text-sm text-muted-foreground">({preparingOrders.length})</span>
            </h2>
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </div>
          <div className="space-y-4">
            {preparingOrders.length > 0 ? (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            ) : (
              <Card className="p-8 glass text-center">
                <p className="text-muted-foreground">Nenhum pedido em preparação</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
