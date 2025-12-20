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
  Zap,
  ArrowRight,
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
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-success/30">
          <div className={`absolute inset-0 bg-gradient-to-br ${config.establishment.isOpen ? 'from-success/10 to-transparent' : 'from-destructive/10 to-transparent'} opacity-50`} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config.establishment.isOpen ? 'bg-success/20 shadow-[0_0_30px_-5px_hsl(var(--success)/0.5)]' : 'bg-destructive/20'}`}>
                <Store className={`h-6 w-6 ${config.establishment.isOpen ? 'text-success' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="font-bold text-lg">Estabelecimento</p>
                <p className="text-sm text-muted-foreground">
                  {config.establishment.isOpen ? 'Aberto para pedidos' : 'Fechado'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.establishment.isOpen}
              onCheckedChange={toggleEstablishment}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>

        <div className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/30">
          <div className={`absolute inset-0 bg-gradient-to-br ${config.establishment.isDeliveryEnabled ? 'from-primary/10 to-transparent' : 'from-muted/10 to-transparent'} opacity-50`} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config.establishment.isDeliveryEnabled ? 'bg-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)]' : 'bg-muted'}`}>
                <Truck className={`h-6 w-6 ${config.establishment.isDeliveryEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-bold text-lg">Delivery</p>
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
          icon={<ShoppingBag className="h-7 w-7" />}
          accentColor="primary"
        />
        <StatsCard
          title="Receita Hoje"
          value={`R$ ${todayRevenue.toFixed(2)}`}
          change={8}
          icon={<DollarSign className="h-7 w-7" />}
          accentColor="success"
        />
        <StatsCard
          title="Tempo Médio"
          value={`${avgDeliveryTime} min`}
          change={-5}
          icon={<Clock className="h-7 w-7" />}
          accentColor="warning"
        />
        <StatsCard
          title="Taxa de Conclusão"
          value="98%"
          change={2}
          icon={<TrendingUp className="h-7 w-7" />}
          accentColor="neon-blue"
        />
      </div>

      {/* Orders Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending Orders */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-status-pending animate-pulse shadow-[0_0_10px_hsl(var(--status-pending))]" />
              Pendentes
              <span className="text-base font-normal text-muted-foreground">({pendingOrders.length})</span>
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
              <div className="p-12 rounded-2xl border border-border/50 bg-card/30 text-center">
                <Zap className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum pedido pendente</p>
              </div>
            )}
          </div>
        </div>

        {/* Preparing Orders */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-status-preparing animate-pulse shadow-[0_0_10px_hsl(var(--status-preparing))]" />
              Em Preparação
              <span className="text-base font-normal text-muted-foreground">({preparingOrders.length})</span>
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
              <div className="p-12 rounded-2xl border border-border/50 bg-card/30 text-center">
                <Zap className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum pedido em preparação</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
