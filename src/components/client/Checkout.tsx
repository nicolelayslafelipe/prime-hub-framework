import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { Order } from '@/types';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

const paymentMethods = [
  { id: 'pix', label: 'PIX', icon: Smartphone, description: 'Pagamento instantâneo' },
  { id: 'credit', label: 'Cartão de Crédito', icon: CreditCard, description: 'Visa, Master, Elo' },
  { id: 'debit', label: 'Cartão de Débito', icon: CreditCard, description: 'Na entrega' },
  { id: 'cash', label: 'Dinheiro', icon: Banknote, description: 'Pagamento na entrega' },
];

export function Checkout({ isOpen, onClose, onOrderPlaced }: CheckoutProps) {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const { config } = useConfig();
  const { addOrder, orders } = useOrders();
  const { user, profile } = useAuth();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [address, setAddress] = useState(profile?.address || '');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  
  // Change fields for cash payment
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState<string>('');

  const subtotal = getSubtotal();
  const deliveryFee = config.establishment.deliveryFee;
  const total = subtotal + deliveryFee;
  
  const changeForNumber = parseFloat(changeFor) || 0;
  const changeAmount = changeForNumber > total ? changeForNumber - total : 0;

  const handlePlaceOrder = () => {
    // Check if user is authenticated
    if (!user) {
      localStorage.setItem('pendingCheckout', 'true');
      onClose();
      navigate('/auth?tab=login');
      return;
    }

    const orderNumber = 1000 + orders.length + 1;
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerId: user.id,
      customerName: customerName || profile?.name || 'Cliente',
      customerPhone: customerPhone || profile?.phone || '(00) 00000-0000',
      customerAddress: address || 'Endereço não informado',
      items: items.map((item, index) => ({
        id: `item-${index}`,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        notes: item.notes,
      })),
      status: 'pending',
      subtotal,
      deliveryFee,
      total,
      paymentMethod: paymentMethods.find(p => p.id === paymentMethod)?.label || 'PIX',
      notes: buildOrderNotes(),
      createdAt: new Date(),
      updatedAt: new Date(),
      needsChange: paymentMethod === 'cash' && needsChange,
      changeFor: paymentMethod === 'cash' && needsChange ? changeForNumber : undefined,
      changeAmount: paymentMethod === 'cash' && needsChange ? changeAmount : undefined,
    };

    addOrder(newOrder);
    setStep('success');
    
    // Clear form and cart after delay
    setTimeout(() => {
      clearCart();
      onOrderPlaced(newOrder);
    }, 2000);
  };

  const buildOrderNotes = () => {
    let orderNotes = notes;
    if (paymentMethod === 'cash' && needsChange && changeForNumber > 0) {
      const changeNote = `💵 Troco para R$ ${changeForNumber.toFixed(2)} (troco: R$ ${changeAmount.toFixed(2)})`;
      orderNotes = orderNotes ? `${orderNotes}\n${changeNote}` : changeNote;
    }
    return orderNotes;
  };

  const handleClose = () => {
    setStep('form');
    setNeedsChange(false);
    setChangeFor('');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-card border-border">
        {step === 'form' ? (
          <>
            <SheetHeader className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-xl font-bold">Finalizar Pedido</SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">1</div>
                  Seus dados
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      placeholder="Seu nome completo"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      placeholder="(00) 00000-0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delivery Address */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">2</div>
                  Endereço de entrega
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço completo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="address" 
                      placeholder="Rua, número, bairro..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 bg-secondary/50"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">3</div>
                  Forma de pagamento
                </h3>
                <RadioGroup value={paymentMethod} onValueChange={(value) => {
                  setPaymentMethod(value);
                  if (value !== 'cash') {
                    setNeedsChange(false);
                    setChangeFor('');
                  }
                }} className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === method.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <RadioGroupItem value={method.id} />
                      <method.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                {/* Change fields for cash payment */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="needs-change"
                        checked={needsChange}
                        onCheckedChange={(checked) => {
                          setNeedsChange(checked as boolean);
                          if (!checked) setChangeFor('');
                        }}
                      />
                      <Label htmlFor="needs-change" className="font-medium cursor-pointer">
                        Precisa de troco?
                      </Label>
                    </div>

                    {needsChange && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="space-y-2">
                          <Label htmlFor="change-for">Troco para quanto?</Label>
                          <div className="relative">
                            <Coins className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="change-for"
                              type="number"
                              placeholder="Ex: 100.00"
                              value={changeFor}
                              onChange={(e) => setChangeFor(e.target.value)}
                              min={total}
                              step="0.01"
                              className="pl-10 bg-background"
                            />
                          </div>
                        </div>

                        {changeForNumber > 0 && (
                          <div className={`p-3 rounded-lg ${changeForNumber >= total ? 'bg-accent/10 border border-accent/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                            {changeForNumber >= total ? (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Troco a receber:</span>
                                <span className="text-lg font-bold text-accent">R$ {changeAmount.toFixed(2)}</span>
                              </div>
                            ) : (
                              <p className="text-sm text-destructive font-medium">
                                O valor deve ser maior que o total do pedido (R$ {total.toFixed(2)})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">4</div>
                  Observações
                </h3>
                <Textarea 
                  placeholder="Alguma observação sobre o pedido? (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-secondary/50 resize-none"
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="card-premium p-4 space-y-3">
                <h4 className="font-semibold text-sm">Resumo do pedido</h4>
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-mono">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="font-mono">R$ {deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary font-mono">R$ {total.toFixed(2)}</span>
                </div>
                
                {/* Change info in summary */}
                {paymentMethod === 'cash' && needsChange && changeForNumber >= total && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        Troco para
                      </span>
                      <span className="font-mono">R$ {changeForNumber.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-accent">
                      <span>Troco</span>
                      <span className="font-mono">R$ {changeAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button 
                className="w-full h-12 font-semibold text-base"
                onClick={handlePlaceOrder}
                disabled={items.length === 0 || (paymentMethod === 'cash' && needsChange && changeForNumber < total)}
              >
                Confirmar Pedido
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-scale-in">
            <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pedido Confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              Seu pedido foi enviado para a cozinha
            </p>
            <div className="card-premium p-4 w-full">
              <p className="text-sm text-muted-foreground mb-1">Tempo estimado</p>
              <p className="text-2xl font-bold text-primary">{config.establishment.estimatedDeliveryTime} min</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
