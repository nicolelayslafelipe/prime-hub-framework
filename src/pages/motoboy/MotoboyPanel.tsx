import { useOrders } from '@/contexts/OrderContext';
import { Logo } from '@/components/shared/Logo';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatus } from '@/types';
import { Clock, Bike, MapPin, Phone, CheckCircle2, Navigation } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const motoboyStatuses: OrderStatus[] = ['ready', 'out_for_delivery'];

export default function MotoboyPanel() {
  const { orders, updateOrderStatus } = useOrders();

  const availableOrders = orders.filter((o) => o.status === 'ready');
  const myDeliveries = orders.filter((o) => o.status === 'out_for_delivery');

  const handleAcceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'out_for_delivery');
  };

  const handleCompleteDelivery = (orderId: string) => {
    updateOrderStatus(orderId, 'delivered');
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
              <Bike className="h-5 w-5 text-panel-motoboy" />
              <span className="font-semibold">Painel do Motoboy</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-success/20 text-success px-3 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Available Orders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-status-ready" />
              <h2 className="text-lg font-semibold">Pedidos Disponíveis</h2>
              <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {availableOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {availableOrders.length > 0 ? (
                availableOrders.map((order) => (
                  <Card key={order.id} className="p-4 glass animate-slide-up">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xl font-bold">#{order.orderNumber}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: ptBR })}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{order.customerAddress}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pagamento:</span>
                        <span className="font-medium">{order.paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-primary">R$ {order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button className="w-full" onClick={() => handleAcceptOrder(order.id)}>
                      Aceitar Entrega
                    </Button>
                  </Card>
                ))
              ) : (
                <Card className="p-8 glass text-center">
                  <Bike className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum pedido disponível</p>
                </Card>
              )}
            </div>
          </div>

          {/* My Deliveries */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-status-delivering animate-pulse" />
              <h2 className="text-lg font-semibold">Minhas Entregas</h2>
              <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {myDeliveries.length}
              </span>
            </div>
            <div className="space-y-4">
              {myDeliveries.length > 0 ? (
                myDeliveries.map((order) => (
                  <Card key={order.id} className="p-4 glass animate-slide-up border-l-4 border-l-status-delivering">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xl font-bold">#{order.orderNumber}</span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-medium">{order.customerName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                        </div>
                      </div>
                      
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5" />
                          <span className="text-sm">{order.customerAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total a cobrar:</span>
                        <span className="text-xl font-bold text-primary">R$ {order.total.toFixed(2)}</span>
                      </div>

                      {order.notes && (
                        <div className="bg-warning/10 rounded-lg px-3 py-2">
                          <p className="text-sm text-warning font-medium">Obs: {order.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="gap-2">
                        <Phone className="h-4 w-4" />
                        Ligar
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Navigation className="h-4 w-4" />
                        GPS
                      </Button>
                    </div>
                    <Button
                      className="w-full mt-2 bg-success hover:bg-success/90"
                      onClick={() => handleCompleteDelivery(order.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Entrega
                    </Button>
                  </Card>
                ))
              ) : (
                <Card className="p-8 glass text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma entrega em andamento</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
