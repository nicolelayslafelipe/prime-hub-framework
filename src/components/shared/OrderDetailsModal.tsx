import { Order, OrderStatus } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Coins,
  FileText,
  Package,
  Store,
  UtensilsCrossed,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  showActions?: boolean;
}

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  waiting_payment: null,
  pending: 'preparing',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
  delivered: null,
  cancelled: null,
};

const statusActions: Record<OrderStatus, string> = {
  waiting_payment: '',
  pending: 'Iniciar Preparo',
  confirmed: 'Iniciar Preparo',
  preparing: 'Marcar Pronto',
  ready: 'Enviar para Entrega',
  out_for_delivery: 'Marcar Entregue',
  delivered: '',
  cancelled: '',
};

const getOrderTypeInfo = (orderType?: string) => {
  switch (orderType) {
    case 'pdv_counter':
      return { label: 'Balcão', icon: Store, color: 'bg-accent text-accent-foreground' };
    case 'pdv_pickup':
      return { label: 'Retirada', icon: Package, color: 'bg-primary text-primary-foreground' };
    case 'pdv_table':
      return { label: 'Mesa', icon: UtensilsCrossed, color: 'bg-orange-500 text-white' };
    case 'delivery':
      return { label: 'Delivery', icon: Truck, color: 'bg-blue-500 text-white' };
    default:
      return { label: 'Delivery', icon: Truck, color: 'bg-blue-500 text-white' };
  }
};

export function OrderDetailsModal({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  showActions = true,
}: OrderDetailsModalProps) {
  if (!order) return null;

  const isPDV = order.orderType?.startsWith('pdv_');
  const orderTypeInfo = getOrderTypeInfo(order.orderType);
  const nextStatus = statusFlow[order.status];
  const actionLabel = statusActions[order.status];

  const handleAction = () => {
    if (nextStatus && onUpdateStatus) {
      onUpdateStatus(order.id, nextStatus);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                Pedido #{order.orderNumber}
                <StatusBadge status={order.status} size="lg" />
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn('text-xs', orderTypeInfo.color)}>
                  <orderTypeInfo.icon className="h-3 w-3 mr-1" />
                  {orderTypeInfo.label}
                </Badge>
                {order.orderType === 'pdv_table' && order.tableNumber && (
                  <Badge variant="outline">Mesa {order.tableNumber}</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Time Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
              <span className="text-muted-foreground/50">•</span>
              <span>{format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Dados do Cliente
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerPhone}</span>
                </div>
                {!isPDV && order.customerAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{order.customerAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Itens do Pedido
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{item.quantity}x</span>
                        <span className="font-medium">{item.productName}</span>
                      </div>
                      {item.additions && item.additions.length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Adicionais: {item.additions.join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="mt-1 text-xs text-warning">
                          Obs: {item.notes}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold">
                      R$ {(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Pagamento
              </h4>
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>{order.paymentMethod}</span>
              </div>
              {order.needsChange && order.changeFor && order.changeAmount !== undefined && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">
                    Troco para R$ {order.changeFor.toFixed(2)} (R$ {order.changeAmount.toFixed(2)})
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Order Notes */}
            {order.notes && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Observações
                  </h4>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10">
                    <FileText className="h-4 w-4 text-warning mt-0.5" />
                    <span className="text-sm text-warning">{order.notes}</span>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {!isPDV && order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Action Footer */}
        {showActions && nextStatus && actionLabel && (
          <div className="p-6 pt-4 border-t">
            <Button
              onClick={handleAction}
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
