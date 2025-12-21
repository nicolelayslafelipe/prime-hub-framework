import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Clock, 
  ChefHat, 
  Package, 
  Truck, 
  CheckCircle2,
  MapPin,
  Wifi,
  CreditCard,
  Copy,
  QrCode,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OrderTrackingProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

interface PaymentData {
  mp_qr_code: string | null;
  mp_qr_code_base64: string | null;
  payment_status: string | null;
}

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'waiting_payment', label: 'Aguardando Pagamento', icon: CreditCard },
  { status: 'pending', label: 'Pedido Recebido', icon: Clock },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle2 },
  { status: 'preparing', label: 'Preparando', icon: ChefHat },
  { status: 'ready', label: 'Pronto', icon: Package },
  { status: 'out_for_delivery', label: 'Saiu para Entrega', icon: Truck },
  { status: 'delivered', label: 'Entregue', icon: CheckCircle2 },
];

const statusIndex: Record<OrderStatus, number> = {
  waiting_payment: 0,
  pending: 1,
  confirmed: 2,
  preparing: 3,
  ready: 4,
  out_for_delivery: 5,
  delivered: 6,
  cancelled: -1,
};

export function OrderTracking({ isOpen, onClose, order: initialOrder }: OrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isConnected, setIsConnected] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (!initialOrder?.id || initialOrder.status !== 'waiting_payment') {
      setPaymentData(null);
      return;
    }

    const fetchPaymentData = async () => {
      const { data } = await supabase
        .from('orders')
        .select('mp_qr_code, payment_status')
        .eq('id', initialOrder.id)
        .single();
      
      if (data) {
        setPaymentData({
          mp_qr_code: data.mp_qr_code,
          mp_qr_code_base64: null,
          payment_status: data.payment_status,
        });
      }
    };

    fetchPaymentData();
  }, [initialOrder?.id, initialOrder?.status]);

  useEffect(() => {
    if (!isOpen || !initialOrder?.id) return;

    const channel = supabase
      .channel(`order-tracking-${initialOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${initialOrder.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as {
            id: string;
            status: string;
            payment_status: string | null;
            mp_qr_code: string | null;
            updated_at: string;
          };
          
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: updatedOrder.status as OrderStatus,
                  updatedAt: new Date(updatedOrder.updated_at),
                }
              : null
          );

          if (updatedOrder.status === 'waiting_payment') {
            setPaymentData({
              mp_qr_code: updatedOrder.mp_qr_code,
              mp_qr_code_base64: null,
              payment_status: updatedOrder.payment_status,
            });
          } else {
            setPaymentData(null);
          }

          if (updatedOrder.payment_status === 'approved') {
            toast.success('Pagamento aprovado!', {
              description: 'Seu pedido está sendo preparado.',
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, initialOrder?.id]);

  const handleCopyPixCode = () => {
    if (paymentData?.mp_qr_code) {
      navigator.clipboard.writeText(paymentData.mp_qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  if (!order) return null;

  const currentStepIndex = statusIndex[order.status];
  const isCancelled = order.status === 'cancelled';
  const isWaitingPayment = order.status === 'waiting_payment';

  const displaySteps = isWaitingPayment || order.paymentMethod?.includes('Online')
    ? statusSteps
    : statusSteps.filter(s => s.status !== 'waiting_payment');

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-card border-border">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold">Pedido #{order.orderNumber}</SheetTitle>
              <p className="text-sm text-muted-foreground">Acompanhe seu pedido em tempo real</p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-1 text-xs text-success">
                <Wifi className="h-3 w-3" />
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isCancelled ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">Pedido Cancelado</h3>
              <p className="text-sm text-muted-foreground">
                Este pedido foi cancelado
              </p>
            </div>
          ) : (
            <>
              {isWaitingPayment && paymentData?.mp_qr_code && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-amber-500">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-semibold">Pagamento Pendente</span>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary mb-2">
                      R$ {order.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="p-4 bg-muted rounded-lg flex flex-col items-center gap-2">
                      <QrCode className="h-12 w-12 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Use o código abaixo</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      Código PIX Copia e Cola:
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs break-all max-h-16 overflow-y-auto font-mono">
                        {paymentData.mp_qr_code}
                      </code>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        onClick={handleCopyPixCode}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">Aguardando pagamento...</span>
                  </div>
                </div>
              )}

              <div className="relative">
                {displaySteps.map((step, index) => {
                  const stepIndexValue = statusIndex[step.status];
                  const isCompleted = stepIndexValue <= currentStepIndex;
                  const isCurrent = stepIndexValue === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex gap-4 pb-8 last:pb-0">
                      {index < displaySteps.length - 1 && (
                        <div 
                          className={cn(
                            "absolute left-5 w-0.5 h-8 translate-y-10 transition-colors duration-500",
                            isCompleted ? 'bg-primary' : 'bg-border'
                          )}
                          style={{ top: `${index * 64 + 32}px` }}
                        />
                      )}
                      
                      <div 
                        className={cn(
                          "relative z-10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500",
                          isCurrent && 'ring-4 ring-primary/20 animate-pulse',
                          isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 pt-2">
                        <p className={cn(
                          "font-medium transition-colors duration-500",
                          isCompleted ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-primary animate-pulse mt-1">
                            Em andamento...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 space-y-4">
                <div className="card-premium p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-medium">Endereço de entrega</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                </div>

                <div className="card-premium p-4">
                  <h4 className="font-medium mb-3">Itens do pedido</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-mono">
                          R$ {(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary font-mono">R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
