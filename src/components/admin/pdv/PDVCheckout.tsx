import { useState } from 'react';
import { usePDV } from '@/contexts/PDVContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, CreditCard, Banknote, QrCode, Store, Package, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashRegister {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
}

interface PDVCheckoutProps {
  open: boolean;
  onClose: () => void;
  currentRegister: CashRegister | null;
  addTransaction: (orderId: string, paymentMethod: string, amount: number) => Promise<boolean>;
}

type OrderType = 'pdv_counter' | 'pdv_pickup' | 'pdv_table';
type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix';

export function PDVCheckout({ open, onClose, currentRegister, addTransaction }: PDVCheckoutProps) {
  const { items, getTotal, clearCart } = usePDV();
  const { addOrder } = useOrders();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('pdv_counter');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');

  const total = getTotal();
  const change = paymentMethod === 'cash' 
    ? Math.max(0, parseFloat(receivedAmount || '0') - total) 
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleSubmit = async () => {
    if (!currentRegister) {
      toast.error('É necessário abrir o caixa primeiro');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (orderType === 'pdv_table' && !tableNumber) {
      toast.error('Informe o número da mesa');
      return;
    }

    if (paymentMethod === 'cash' && parseFloat(receivedAmount || '0') < total) {
      toast.error('Valor recebido insuficiente');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map items to order items format
      const orderItems = items.map(item => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes,
      }));

      // Create order with correct order_type for PDV
      const orderData = {
        customerId: user.id,
        customerName: customerName || 'Cliente PDV',
        customerPhone: customerPhone || '',
        customerAddress: orderType === 'pdv_table' ? `Mesa ${tableNumber}` : 'Balcão',
        items: orderItems,
        subtotal: total,
        deliveryFee: 0,
        total: total,
        paymentMethod: paymentMethod === 'cash' ? 'Dinheiro' 
          : paymentMethod === 'credit_card' ? 'Cartão Crédito'
          : paymentMethod === 'debit_card' ? 'Cartão Débito' 
          : 'PIX',
        status: 'confirmed' as const,
        notes: notes || undefined,
        needsChange: paymentMethod === 'cash' && change > 0,
        changeFor: paymentMethod === 'cash' ? parseFloat(receivedAmount) : undefined,
        changeAmount: change > 0 ? change : undefined,
        orderType: orderType, // Salva o tipo correto do pedido (pdv_counter, pdv_pickup, pdv_table)
        tableNumber: orderType === 'pdv_table' ? tableNumber : undefined,
      };

      const result = await addOrder(orderData);

      if (result && typeof result === 'object' && 'id' in result) {
        // Add cash transaction
        await addTransaction(result.id as string, paymentMethod, total);
        
        toast.success('Venda realizada com sucesso!', {
          description: change > 0 ? `Troco: ${formatPrice(change)}` : undefined,
        });

        clearCart();
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating PDV order:', error);
      toast.error('Erro ao finalizar venda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOrderType('pdv_counter');
    setTableNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setReceivedAmount('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Type */}
          <div className="space-y-3">
            <Label>Tipo de Pedido</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'pdv_counter', label: 'Balcão', icon: Store },
                { value: 'pdv_pickup', label: 'Retirada', icon: Package },
                { value: 'pdv_table', label: 'Mesa', icon: UtensilsCrossed },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setOrderType(value as OrderType)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all',
                    orderType === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Number */}
          {orderType === 'pdv_table' && (
            <div className="space-y-2">
              <Label htmlFor="table">Número da Mesa *</Label>
              <Input
                id="table"
                placeholder="Ex: 5"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
          )}

          {/* Customer Info (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                placeholder="Cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { value: 'cash', label: 'Dinheiro', icon: Banknote },
                { value: 'credit_card', label: 'Crédito', icon: CreditCard },
                { value: 'debit_card', label: 'Débito', icon: CreditCard },
                { value: 'pix', label: 'PIX', icon: QrCode },
              ].map(({ value, label, icon: Icon }) => (
                <Label
                  key={value}
                  htmlFor={value}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    paymentMethod === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={value} id={value} className="sr-only" />
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Cash Payment - Change calculation */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 p-3 rounded-lg bg-secondary/50">
              <div className="space-y-2">
                <Label htmlFor="received">Valor Recebido</Label>
                <Input
                  id="received"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                />
              </div>
              {parseFloat(receivedAmount || '0') >= total && (
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Troco:</span>
                  <span className="font-bold text-primary">{formatPrice(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações gerais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Total & Submit */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Venda'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
