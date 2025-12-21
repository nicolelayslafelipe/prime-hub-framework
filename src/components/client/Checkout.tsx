import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClientAddresses, ClientAddress } from '@/hooks/useClientAddresses';
import { useClientPreferences } from '@/hooks/useClientPreferences';
import { fetchAddressByCep, formatCepForDisplay, isValidCep, formatCep } from '@/lib/cep';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  Coins,
  Plus,
  Star,
  AlertCircle,
  Loader2,
  Home,
  Building2,
  Briefcase,
  Search
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

const labelIcons: Record<string, React.ReactNode> = {
  'Casa': <Home className="h-4 w-4" />,
  'Apartamento': <Building2 className="h-4 w-4" />,
  'Trabalho': <Briefcase className="h-4 w-4" />,
};

interface NewAddressForm {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function Checkout({ isOpen, onClose, onOrderPlaced }: CheckoutProps) {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const { config } = useConfig();
  const { addOrder, orders } = useOrders();
  const { user, profile } = useAuth();
  const { 
    addresses, 
    isLoading: isLoadingAddresses, 
    getDefaultAddress, 
    formatAddressForDisplay,
    validateAddress,
    getValidationErrors,
    refetch: refetchAddresses
  } = useClientAddresses();
  const { preferences, updatePreference } = useClientPreferences();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  
  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  const initialNewAddress: NewAddressForm = {
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
  };
  
  const [newAddress, setNewAddress] = useState<NewAddressForm>(initialNewAddress);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  
  // Change fields for cash payment
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState<string>('');
  
  // Validation
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Reset new address form
  const resetNewAddressForm = useCallback(() => {
    setNewAddress(initialNewAddress);
    setCepFound(false);
    setAddressErrors([]);
    setTouchedFields(new Set());
  }, []);

  const subtotal = getSubtotal();
  const deliveryFee = config.establishment.deliveryFee;
  const total = subtotal + deliveryFee;
  
  const changeForNumber = parseFloat(changeFor) || 0;
  const changeAmount = changeForNumber > total ? changeForNumber - total : 0;

  // Initialize selected address from saved addresses
  useEffect(() => {
    if (!isLoadingAddresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setShowNewAddressForm(false);
      }
    } else if (!isLoadingAddresses && addresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [isLoadingAddresses, addresses, selectedAddressId, getDefaultAddress]);

  // Initialize payment method from preferences
  useEffect(() => {
    if (preferences?.last_payment_method && preferences.save_payment_method) {
      setPaymentMethod(preferences.last_payment_method);
    }
  }, [preferences]);

  // Update customer info when profile changes
  useEffect(() => {
    if (profile) {
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone) setCustomerPhone(profile.phone);
    }
  }, [profile]);

  // CEP auto-search
  const handleCepSearch = useCallback(async (cep: string) => {
    if (!isValidCep(cep)) {
      setCepFound(false);
      return;
    }

    setIsSearchingCep(true);
    setCepFound(false);

    try {
      const addressData = await fetchAddressByCep(cep);
      
      if (addressData) {
        // Update address fields with whatever data we received
        setNewAddress(prev => ({
          ...prev,
          street: addressData.street || prev.street,
          neighborhood: addressData.neighborhood || prev.neighborhood,
          city: addressData.city,
          state: addressData.state,
        }));
        setCepFound(true);
        
        if (addressData.isPartial) {
          // Generic city CEP - user needs to fill street and neighborhood
          toast.info('CEP de cidade encontrado', {
            description: 'Preencha a rua e o bairro manualmente',
          });
          // Focus on street field for partial CEPs
          setTimeout(() => {
            document.getElementById('checkout-street')?.focus();
          }, 100);
        } else {
          toast.success('Endereço encontrado!');
          // Focus on number field for complete CEPs
          setTimeout(() => {
            document.getElementById('checkout-number')?.focus();
          }, 100);
        }
      } else {
        toast.error('CEP não encontrado', {
          description: 'Verifique o CEP digitado',
        });
      }
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsSearchingCep(false);
    }
  }, []);

  // Debounced CEP search
  useEffect(() => {
    const cleanCep = formatCep(newAddress.zip_code || '');
    if (cleanCep.length === 8) {
      const timer = setTimeout(() => {
        handleCepSearch(cleanCep);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCepFound(false);
    }
  }, [newAddress.zip_code, handleCepSearch]);

  const getSelectedAddress = (): ClientAddress | null => {
    if (selectedAddressId) {
      return addresses.find(a => a.id === selectedAddressId) || null;
    }
    return null;
  };

  const getAddressForOrder = (): string => {
    if (showNewAddressForm) {
      let formatted = `${newAddress.street}, ${newAddress.number}`;
      if (newAddress.complement) formatted += ` - ${newAddress.complement}`;
      formatted += ` - ${newAddress.neighborhood}, ${newAddress.city} - ${newAddress.state}`;
      formatted += ` (CEP: ${newAddress.zip_code})`;
      return formatted;
    }
    
    const selected = getSelectedAddress();
    if (selected) {
      return formatAddressForDisplay(selected);
    }
    
    return 'Endereço não informado';
  };

  const validateOrderAddress = (): boolean => {
    if (showNewAddressForm) {
      const errors: string[] = [];
      const cleanZip = formatCep(newAddress.zip_code);
      
      if (cleanZip.length !== 8) errors.push('CEP inválido');
      if (!newAddress.street?.trim()) errors.push('Rua é obrigatória');
      if (!newAddress.number?.trim()) errors.push('Número é obrigatório');
      if (!newAddress.neighborhood?.trim()) errors.push('Bairro é obrigatório');
      if (!newAddress.city?.trim()) errors.push('Cidade é obrigatória');
      if (!newAddress.state?.trim()) errors.push('Estado é obrigatório');
      
      setAddressErrors(errors);
      return errors.length === 0;
    } else {
      const selected = getSelectedAddress();
      const errors = getValidationErrors(selected);
      setAddressErrors(errors);
      return errors.length === 0;
    }
  };

  const handlePlaceOrder = async () => {
    // Check if user is authenticated
    if (!user) {
      localStorage.setItem('pendingCheckout', 'true');
      onClose();
      navigate('/auth?tab=login');
      return;
    }

    // Validate address
    if (!validateOrderAddress()) {
      toast.error('Endereço incompleto', {
        description: addressErrors[0] || 'Verifique o endereço de entrega',
      });
      return;
    }

    // Save payment method preference
    if (preferences?.save_payment_method) {
      await updatePreference('last_payment_method', paymentMethod);
    }

    const orderNumber = 1000 + orders.length + 1;
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber,
      customerId: user.id,
      customerName: customerName || profile?.name || 'Cliente',
      customerPhone: customerPhone || profile?.phone || '(00) 00000-0000',
      customerAddress: getAddressForOrder(),
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
    setShowNewAddressForm(false);
    setSelectedAddressId(null);
    resetNewAddressForm();
    onClose();
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCepForDisplay(value);
    setNewAddress(prev => ({ ...prev, zip_code: formatted }));
  };

  const isAddressValid = (): boolean => {
    if (showNewAddressForm) {
      const cleanZip = formatCep(newAddress.zip_code);
      return !!(
        cleanZip.length === 8 &&
        newAddress.street?.trim() &&
        newAddress.number?.trim() &&
        newAddress.neighborhood?.trim() &&
        newAddress.city?.trim() &&
        newAddress.state?.trim()
      );
    }
    return !!selectedAddressId && validateAddress(getSelectedAddress());
  };

  const canPlaceOrder = 
    items.length > 0 && 
    customerPhone.trim().length > 0 &&
    isAddressValid() && 
    !(paymentMethod === 'cash' && needsChange && changeForNumber < total);

  // Mark field as touched
  const markFieldTouched = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  // Real-time validation for new address
  useEffect(() => {
    if (showNewAddressForm && touchedFields.size > 0) {
      const errors: string[] = [];
      const cleanZip = formatCep(newAddress.zip_code);
      
      if (touchedFields.has('zip_code') && cleanZip.length > 0 && cleanZip.length !== 8) {
        errors.push('CEP inválido');
      }
      if (touchedFields.has('street') && !newAddress.street?.trim()) {
        errors.push('Rua é obrigatória');
      }
      if (touchedFields.has('number') && !newAddress.number?.trim()) {
        errors.push('Número é obrigatório');
      }
      if (touchedFields.has('neighborhood') && !newAddress.neighborhood?.trim()) {
        errors.push('Bairro é obrigatório');
      }
      if (touchedFields.has('city') && !newAddress.city?.trim()) {
        errors.push('Cidade é obrigatória');
      }
      if (touchedFields.has('state') && !newAddress.state?.trim()) {
        errors.push('Estado é obrigatório');
      }
      
      setAddressErrors(errors);
    }
  }, [showNewAddressForm, newAddress, touchedFields]);

  // Get validation class for field
  const getFieldValidationClass = (fieldName: string, value: string | undefined): string => {
    if (!touchedFields.has(fieldName)) return '';
    if (fieldName === 'zip_code') {
      const cleanZip = formatCep(value || '');
      return cleanZip.length > 0 && cleanZip.length !== 8 ? 'border-destructive focus-visible:ring-destructive' : '';
    }
    return !value?.trim() ? 'border-destructive focus-visible:ring-destructive' : '';
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
                
                {isLoadingAddresses ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-3">
                    {/* Saved addresses */}
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setShowNewAddressForm(false);
                            setSelectedAddressId(addr.id);
                            setAddressErrors([]);
                          }}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedAddressId === addr.id && !showNewAddressForm
                              ? 'border-primary bg-primary/5' 
                              : 'border-border bg-secondary/30 hover:bg-secondary/50'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border-2 mt-1 flex items-center justify-center ${
                            selectedAddressId === addr.id && !showNewAddressForm
                              ? 'border-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {selectedAddressId === addr.id && !showNewAddressForm && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {labelIcons[addr.label] || <MapPin className="h-4 w-4" />}
                              <span className="font-medium text-sm">{addr.label}</span>
                              {addr.is_default && (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-primary" />
                                  Padrão
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {formatAddressForDisplay(addr)}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* New address option */}
                      <div
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setSelectedAddressId(null);
                          resetNewAddressForm();
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          showNewAddressForm
                            ? 'border-primary bg-primary/5' 
                            : 'border-border bg-secondary/30 hover:bg-secondary/50'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          showNewAddressForm
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {showNewAddressForm && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Entregar em outro endereço</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* New address form */}
                {(showNewAddressForm || addresses.length === 0) && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="checkout-cep">CEP <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Input
                          id="checkout-cep"
                          placeholder="00000-000"
                          value={newAddress.zip_code}
                          onChange={(e) => handleCepChange(e.target.value)}
                          onBlur={() => markFieldTouched('zip_code')}
                          className={`pr-10 bg-background ${getFieldValidationClass('zip_code', newAddress.zip_code)}`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isSearchingCep ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : cepFound ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Search className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="checkout-street">Rua <span className="text-destructive">*</span></Label>
                      <Input
                        id="checkout-street"
                        placeholder="Rua, Avenida..."
                        value={newAddress.street}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                        onBlur={() => markFieldTouched('street')}
                        className={`bg-background ${getFieldValidationClass('street', newAddress.street)}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="checkout-number">Número <span className="text-destructive">*</span></Label>
                        <Input
                          id="checkout-number"
                          placeholder="123"
                          value={newAddress.number}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, number: e.target.value }))}
                          onBlur={() => markFieldTouched('number')}
                          className={`bg-background ${getFieldValidationClass('number', newAddress.number)}`}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="checkout-complement">Complemento</Label>
                        <Input
                          id="checkout-complement"
                          placeholder="Apto, bloco..."
                          value={newAddress.complement}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, complement: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="checkout-neighborhood">Bairro <span className="text-destructive">*</span></Label>
                      <Input
                        id="checkout-neighborhood"
                        placeholder="Bairro"
                        value={newAddress.neighborhood}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                        onBlur={() => markFieldTouched('neighborhood')}
                        className={`bg-background ${getFieldValidationClass('neighborhood', newAddress.neighborhood)}`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="checkout-city">Cidade <span className="text-destructive">*</span></Label>
                        <Input
                          id="checkout-city"
                          placeholder="Cidade"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                          onBlur={() => markFieldTouched('city')}
                          className={`bg-background ${getFieldValidationClass('city', newAddress.city)}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkout-state">Estado <span className="text-destructive">*</span></Label>
                        <Input
                          id="checkout-state"
                          placeholder="SP"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                          onBlur={() => markFieldTouched('state')}
                          className={`bg-background ${getFieldValidationClass('state', newAddress.state)}`}
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Address validation errors */}
                {addressErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
                    <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Endereço incompleto
                    </div>
                    <ul className="text-xs text-destructive/80 list-disc list-inside">
                      {addressErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
                disabled={!canPlaceOrder}
              >
                Confirmar Pedido
              </Button>
              {!canPlaceOrder && items.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {!customerPhone.trim() ? 'Informe seu telefone para continuar' : 
                   !isAddressValid() ? 'Preencha o endereço de entrega para continuar' :
                   paymentMethod === 'cash' && needsChange && changeForNumber < total ? 'Informe um valor válido para o troco' : ''}
                </p>
              )}
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
