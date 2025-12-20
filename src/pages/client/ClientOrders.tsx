import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClientOrders } from '@/hooks/useClientOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowLeft, Package, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientOrders() {
  const { user } = useAuth();
  const { orders, isLoading } = useClientOrders(user?.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Meus Pedidos</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Nenhum pedido ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Seus pedidos aparecerão aqui
              </p>
              <Button asChild>
                <Link to="/">Ver Cardápio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">Pedido #{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(order.createdAt || ''), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                
                <div className="text-sm text-muted-foreground flex items-start gap-1 mb-3">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{order.customerAddress}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">{order.paymentMethod}</span>
                  <span className="font-bold text-primary">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
