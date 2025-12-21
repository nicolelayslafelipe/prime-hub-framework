import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { OrderCard } from '@/components/admin/OrderCard';
import { useConfig } from '@/contexts/ConfigContext';
import { useOrders } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  TrendingUp,
  Store,
  Truck,
  Package,
  ArrowRight,
} from 'lucide-react';
import { OrderStatus } from '@/types';

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  waiting_payment: 'pending',
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
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="card-premium p-5 transition-all duration-300 hover:shadow-premium-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config.establishment.isOpen ? 'bg-accent/15 text-accent' : 'bg-destructive/15 text-destructive'}`}>
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Estabelecimento</p>
                <p className="text-sm text-muted-foreground">
                  {config.establishment.isOpen ? 'Aberto para pedidos' : 'Fechado'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.establishment.isOpen}
              onCheckedChange={toggleEstablishment}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>

        <div className="card-premium p-5 transition-all duration-300 hover:shadow-premium-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config.establishment.isDeliveryEnabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Delivery</p>
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
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatsCard
          title="Pedidos Hoje"
          value={todayOrders}
          change={12}
          icon={<ShoppingBag className="h-6 w-6" />}
          accentColor="gold"
        />
        <StatsCard
          title="Receita Hoje"
          value={`R$ ${todayRevenue.toFixed(2)}`}
          change={8}
          icon={<DollarSign className="h-6 w-6" />}
          accentColor="emerald"
        />
        <StatsCard
          title="Tempo Médio"
          value={`${avgDeliveryTime} min`}
          change={-5}
          icon={<Clock className="h-6 w-6" />}
          accentColor="sapphire"
        />
        <StatsCard
          title="Taxa de Conclusão"
          value="98%"
          change={2}
          icon={<TrendingUp className="h-6 w-6" />}
          accentColor="default"
        />
      </div>

      {/* Orders Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending Orders */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-status-pending" />
              Pendentes
              <span className="text-sm font-normal text-muted-foreground">({pendingOrders.length})</span>
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
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
              <div className="card-premium p-10 text-center">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum pedido pendente</p>
              </div>
            )}
          </div>
        </div>

        {/* Preparing Orders */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-status-preparing" />
              Em Preparação
              <span className="text-sm font-normal text-muted-foreground">({preparingOrders.length})</span>
            </h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
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
              <div className="card-premium p-10 text-center">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum pedido em preparação</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
