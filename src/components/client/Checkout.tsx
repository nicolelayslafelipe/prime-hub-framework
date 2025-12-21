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
import { useClientPaymentMethods } from '@/hooks/useClientPaymentMethods';
import { useDeliveryFeeCalculation } from '@/hooks/useDeliveryFeeCalculation';
import { useETACalculation } from '@/hooks/useETACalculation';
import { useMercadoPagoPayment } from '@/hooks/useMercadoPagoPayment';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { useCoupons } from '@/hooks/useCoupons';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { PaymentModal } from '@/components/client/PaymentModal';
import { GeocodedAddress } from '@/hooks/useAddressSearch';
import { formatBrazilianPhone, isValidBrazilianPhone } from '@/lib/formatPhone';
import { supabase } from '@/integrations/supabase/client';
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
  Home,
  Building2,
  Briefcase,
  Loader2,
  Clock,
  Wallet,
  XCircle,
  Tag,
  X
} from 'lucide-react';
import { Order } from '@/types';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

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
  latitude?: number;
  longitude?: number;
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
  const { 
    methods: paymentMethods, 
    isLoading: isLoadingPaymentMethods,
    isMethodActive,
    getMethodById 
  } = useClientPaymentMethods();
  const { calculateFee, isCalculating: isCalculatingFee, lastResult: feeResult } = useDeliveryFeeCalculation();
  const { calculateETA, isCalculating: isCalculatingETA, lastResult: etaResult } = useETACalculation();
  const { 
    createPayment, 
    paymentState, 
    isCreating: isCreatingPayment, 
    isError: isPaymentError,
    paymentResult, 
    error: paymentErrorMessage,
    resetPayment,
    retryPayment 
  } = useMercadoPagoPayment();
  const { isCurrentlyOpen, getNextOpeningTime, isLoading: isLoadingHours } = useBusinessHours();
  const {
    appliedCoupon,
    discount: couponDiscount,
    isValidating: isValidatingCoupon,
    applyCoupon,
    removeCoupon,
    incrementCouponUsage,
  } = useCoupons();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState('pix_online');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(profile?.name || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  
  // Address state - Unified type for address selection
  type DeliveryAddressType = 'saved' | 'custom';
  const [deliveryAddressType, setDeliveryAddressType] = useState<DeliveryAddressType>('saved');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Derived state for backward compatibility
  const showNewAddressForm = deliveryAddressType === 'custom';
  
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
  
  // Change fields for cash payment
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState<string>('');
  
  // Validation
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  // Dynamic delivery fee
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState<number | null>(null);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [isOutsideDeliveryArea, setIsOutsideDeliveryArea] = useState(false);
  
  // Dynamic ETA
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<number | null>(null);
  const [currentPaymentType, setCurrentPaymentType] = useState<'pix' | 'card'>('pix');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);

  // Reset new address form
  const resetNewAddressForm = useCallback(() => {
    setNewAddress(initialNewAddress);
    setAddressErrors([]);
    setTouchedFields(new Set());
    setCalculatedDeliveryFee(null);
    setDeliveryDistance(null);
    setIsOutsideDeliveryArea(false);
    setEstimatedTime(null);
  }, []);

  const subtotal = getSubtotal();
  
  // Use calculated fee if distance-based pricing is enabled and we have coordinates
  const deliveryFee = calculatedDeliveryFee !== null ? calculatedDeliveryFee : config.establishment.deliveryFee;
  const totalBeforeDiscount = subtotal + deliveryFee;
  const total = Math.max(0, totalBeforeDiscount - couponDiscount);
  
  const changeForNumber = parseFloat(changeFor) || 0;
  const changeAmount = changeForNumber > total ? changeForNumber - total : 0;

  // Handle phone input with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBrazilianPhone(e.target.value);
    setCustomerPhone(formatted);
  };

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const success = await applyCoupon(couponCode, subtotal);
    if (success) {
      setCouponCode('');
    }
  };

  // Initialize selected address from saved addresses
  useEffect(() => {
    if (!isLoadingAddresses) {
      if (addresses.length > 0 && !selectedAddressId) {
        const defaultAddr = getDefaultAddress();
        if (defaultAddr) {
          setDeliveryAddressType('saved');
          setSelectedAddressId(defaultAddr.id);
        }
      } else if (addresses.length === 0) {
        // No saved addresses, force custom mode
        setDeliveryAddressType('custom');
      }
    }
  }, [isLoadingAddresses, addresses, selectedAddressId, getDefaultAddress]);

  // Initialize payment method from preferences - with validation
  useEffect(() => {
    if (!isLoadingPaymentMethods && paymentMethods.length > 0) {
      if (preferences?.last_payment_method && preferences.save_payment_method) {
        // Check if the saved payment method is still active
        const savedMethodIsActive = isMethodActive(preferences.last_payment_method);
        
        if (savedMethodIsActive) {
          setPaymentMethod(preferences.last_payment_method);
        } else {
          // Fallback to first available payment method
          if (paymentMethods.length > 0) {
            setPaymentMethod(paymentMethods[0].id);
          }
        }
      } else {
        // No saved preference, use first method
        if (paymentMethods.length > 0) {
          setPaymentMethod(paymentMethods[0].id);
        }
      }
    }
  }, [preferences, paymentMethods, isLoadingPaymentMethods, isMethodActive]);

  // Update customer info when profile changes
  useEffect(() => {
    if (profile) {
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone) setCustomerPhone(profile.phone);
    }
  }, [profile]);

  // Handle address selection from Mapbox autocomplete
  const handleAddressSelect = useCallback(async (address: GeocodedAddress) => {
    setNewAddress({
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.postcode || '',
      complement: '',
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setAddressErrors([]);
    
    // Calculate delivery fee and ETA if distance-based pricing is enabled
    if (config.establishment.distanceFeeEnabled && address.latitude && address.longitude) {
      const result = await calculateFee(address.latitude, address.longitude, {
        enabled: true,
        baseFee: config.establishment.baseDeliveryFee || 5,
        pricePerKm: config.establishment.pricePerKm || 2,
        minDistanceIncluded: config.establishment.minDistanceIncluded || 2,
        establishmentLatitude: config.establishment.establishmentLatitude || null,
        establishmentLongitude: config.establishment.establishmentLongitude || null,
      });
      
      if (result) {
        setCalculatedDeliveryFee(result.fee);
        setDeliveryDistance(result.distance);
        
        // Check if outside delivery area
        const maxRadius = config.establishment.maxDeliveryRadius || 10;
        if (result.distance > maxRadius) {
          setIsOutsideDeliveryArea(true);
          toast.error('Endereço fora da área de entrega', {
            description: `Distância: ${result.distance.toFixed(1)} km. Máximo: ${maxRadius} km`,
          });
        } else {
          setIsOutsideDeliveryArea(false);
          
          // Calculate ETA
          const etaResult = await calculateETA(address.latitude, address.longitude, {
            establishmentLatitude: config.establishment.establishmentLatitude || null,
            establishmentLongitude: config.establishment.establishmentLongitude || null,
            averagePrepTime: config.establishment.averagePrepTime || 15,
            peakTimeAdjustment: 0, // Could add peak hour detection
          });
          
          if (etaResult) {
            setEstimatedTime(etaResult.displayText);
          }
          
          toast.success('Endereço selecionado!');
        }
      }
    } else {
      setIsOutsideDeliveryArea(false);
      // Simple ETA fallback
      const prepTime = config.establishment.averagePrepTime || 15;
      setEstimatedTime(`${prepTime + 20}-${prepTime + 30} min`);
      toast.success('Endereço selecionado!');
    }
    
    // Focus on number field if empty
    if (!address.number) {
      setTimeout(() => {
        document.getElementById('checkout-number')?.focus();
      }, 100);
    }
  }, [config.establishment, calculateFee, calculateETA]);
  
  // Calculate fee when selecting a saved address with coordinates
  const handleSelectSavedAddress = useCallback(async (addr: ClientAddress) => {
    setDeliveryAddressType('saved');
    setSelectedAddressId(addr.id);
    setAddressErrors([]);
    
    // Calculate delivery fee if distance-based pricing is enabled and address has coordinates
    if (config.establishment.distanceFeeEnabled && addr.latitude && addr.longitude) {
      const result = await calculateFee(addr.latitude, addr.longitude, {
        enabled: true,
        baseFee: config.establishment.baseDeliveryFee || 5,
        pricePerKm: config.establishment.pricePerKm || 2,
        minDistanceIncluded: config.establishment.minDistanceIncluded || 2,
        establishmentLatitude: config.establishment.establishmentLatitude || null,
        establishmentLongitude: config.establishment.establishmentLongitude || null,
      });
      
      if (result) {
        setCalculatedDeliveryFee(result.fee);
        setDeliveryDistance(result.distance);
        
        // Check if outside delivery area
        const maxRadius = config.establishment.maxDeliveryRadius || 10;
        if (result.distance > maxRadius) {
          setIsOutsideDeliveryArea(true);
          toast.error('Endereço fora da área de entrega', {
            description: `Distância: ${result.distance.toFixed(1)} km. Máximo: ${maxRadius} km`,
          });
        } else {
          setIsOutsideDeliveryArea(false);
          
          // Calculate ETA
          const etaResult = await calculateETA(addr.latitude, addr.longitude, {
            establishmentLatitude: config.establishment.establishmentLatitude || null,
            establishmentLongitude: config.establishment.establishmentLongitude || null,
            averagePrepTime: config.establishment.averagePrepTime || 15,
            peakTimeAdjustment: 0,
          });
          
          if (etaResult) {
            setEstimatedTime(etaResult.displayText);
          }
        }
      }
    } else {
      setCalculatedDeliveryFee(null);
      setDeliveryDistance(null);
      setIsOutsideDeliveryArea(false);
      // Simple ETA fallback
      const prepTime = config.establishment.averagePrepTime || 15;
      setEstimatedTime(`${prepTime + 20}-${prepTime + 30} min`);
    }
  }, [config.establishment, calculateFee, calculateETA]);

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
      if (newAddress.zip_code) formatted += ` (CEP: ${newAddress.zip_code})`;
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

  // Salvar endereço automaticamente no banco
  const saveNewAddressToDatabase = async () => {
    if (!user || !showNewAddressForm) return;
    
    try {
      // Verificar se já existe um endereço similar
      const { data: existingAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', user.id)
        .eq('street', newAddress.street)
        .eq('number', newAddress.number);
      
      // Se já existe, não salvar duplicado
      if (existingAddresses && existingAddresses.length > 0) {
        return;
      }
      
      // Se não há endereços salvos, definir como padrão
      const isFirstAddress = addresses.length === 0;
      
      const { error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          label: 'Casa',
          street: newAddress.street,
          number: newAddress.number,
          complement: newAddress.complement || null,
          neighborhood: newAddress.neighborhood,
          city: newAddress.city,
          state: newAddress.state,
          zip_code: newAddress.zip_code || '',
          is_default: isFirstAddress,
          latitude: newAddress.latitude,
          longitude: newAddress.longitude,
        });
      
      if (error) {
        console.error('Error saving address:', error);
      } else {
        // Atualizar lista de endereços para próximo uso
        refetchAddresses();
      }
    } catch (error) {
      console.error('Error saving address:', error);
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

    // Verificar se estabelecimento está aberto
    if (!config.establishment.isOpen) {
      toast.error('Estabelecimento fechado', {
        description: 'Não é possível fazer pedidos no momento',
      });
      return;
    }

    // Verificar se método de pagamento está ativo
    if (!isMethodActive(paymentMethod)) {
      toast.error('Forma de pagamento indisponível', {
        description: 'Selecione outra forma de pagamento',
      });
      return;
    }

    // Validate address
    if (!validateOrderAddress()) {
      toast.error('Endereço incompleto', {
        description: addressErrors[0] || 'Verifique o endereço de entrega',
      });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Save payment method preference
      if (preferences?.save_payment_method) {
        await updatePreference('last_payment_method', paymentMethod);
      }

      // Salvar endereço automaticamente se for novo
      if (showNewAddressForm) {
        saveNewAddressToDatabase();
      }

      // Get coordinates for order
      let customerLatitude: number | undefined;
      let customerLongitude: number | undefined;
      
      if (showNewAddressForm && newAddress.latitude && newAddress.longitude) {
        customerLatitude = newAddress.latitude;
        customerLongitude = newAddress.longitude;
      } else {
        const selectedAddr = getSelectedAddress();
        if (selectedAddr?.latitude && selectedAddr?.longitude) {
          customerLatitude = selectedAddr.latitude;
          customerLongitude = selectedAddr.longitude;
        }
      }

      const isOnlinePayment = paymentMethod === 'pix_online' || paymentMethod === 'card_online';
      const orderStatus = isOnlinePayment ? 'waiting_payment' : 'pending';
      
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: customerName || profile?.name || 'Cliente',
          customer_phone: customerPhone || profile?.phone || '(00) 00000-0000',
          customer_address: getAddressForOrder(),
          customer_latitude: customerLatitude,
          customer_longitude: customerLongitude,
          status: orderStatus,
          payment_status: isOnlinePayment ? 'pending' : null,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: paymentMethods.find(p => p.id === paymentMethod)?.label || 'PIX Online',
          notes: buildOrderNotes(),
          needs_change: paymentMethod === 'cash' && needsChange,
          change_for: paymentMethod === 'cash' && needsChange ? changeForNumber : undefined,
          change_amount: paymentMethod === 'cash' && needsChange ? changeAmount : undefined,
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message || 'Erro ao criar pedido');
      }

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
      }

      // Handle online payment - ABERTURA IMEDIATA DO MODAL
      if (isOnlinePayment) {
        const paymentType = paymentMethod === 'pix_online' ? 'pix' : 'card';
        
        // Configurar dados do pagamento ANTES de abrir o modal
        setCurrentOrderId(orderData.id);
        setCurrentOrderNumber(orderData.order_number);
        setCurrentPaymentType(paymentType);
        setCurrentPaymentAmount(total);
        
        // ABRIR MODAL IMEDIATAMENTE com loading
        setShowPaymentModal(true);

        // Executar operações em PARALELO (inserir itens e criar pagamento)
        const [_, paymentResult] = await Promise.all([
          // Salvar endereço em background (já iniciado acima mas garantir conclusão)
          showNewAddressForm ? saveNewAddressToDatabase() : Promise.resolve(),
          // Criar pagamento PIX/Card - PRIORIDADE
          createPayment({
            orderId: orderData.id,
            paymentType,
            amount: total,
            customerEmail: user.email,
            description: `Pedido #${orderData.order_number}`,
          }),
        ]);

        // Se falhou, atualizar status do pedido (modal mostrará o erro)
        if (!paymentResult) {
          await supabase
            .from('orders')
            .update({ status: 'cancelled', payment_status: 'cancelled' })
            .eq('id', orderData.id);
        }
      } else {
        // Non-online payment - go directly to success
        const newOrder: Order = {
          id: orderData.id,
          orderNumber: orderData.order_number,
          customerId: user.id,
          customerName: orderData.customer_name,
          customerPhone: orderData.customer_phone,
          customerAddress: orderData.customer_address,
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
          customerLatitude,
          customerLongitude,
        };

        setStep('success');
        
        // Clear form and cart after delay
        setTimeout(() => {
          clearCart();
          onOrderPlaced(newOrder);
        }, 2000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Erro ao criar pedido', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentApproved = () => {
    setShowPaymentModal(false);
    setStep('success');
    clearCart();
    toast.success('Pagamento aprovado!');
  };

  // Retry de pagamento quando falha
  const handleRetryPayment = async () => {
    if (!currentOrderId || !user) return;
    
    retryPayment();
    
    const result = await createPayment({
      orderId: currentOrderId,
      paymentType: currentPaymentType,
      amount: currentPaymentAmount,
      customerEmail: user.email,
      description: `Pedido #${currentOrderNumber}`,
    });

    if (!result) {
      // Se falhou novamente, já será tratado pelo estado do hook
      console.error('Retry payment failed');
    }
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
    setDeliveryAddressType('saved');
    setSelectedAddressId(null);
    resetNewAddressForm();
    resetPayment();
    setShowPaymentModal(false);
    setCurrentOrderId(null);
    setCurrentOrderNumber(null);
    onClose();
  };

  const isAddressValid = (): boolean => {
    if (showNewAddressForm) {
      return !!(
        newAddress.street?.trim() &&
        newAddress.number?.trim() &&
        newAddress.neighborhood?.trim() &&
        newAddress.city?.trim() &&
        newAddress.state?.trim()
      );
    }
    return !!selectedAddressId && validateAddress(getSelectedAddress());
  };

  // Verificar se estabelecimento está aberto - combina toggle manual + horário automático
  const isEstablishmentOpen = config.establishment.isOpen && (isLoadingHours || isCurrentlyOpen());
  const nextOpeningTime = getNextOpeningTime();

  const isPhoneValid = isValidBrazilianPhone(customerPhone);

  const canPlaceOrder = 
    items.length > 0 && 
    isPhoneValid &&
    isAddressValid() && 
    !isOutsideDeliveryArea &&
    isEstablishmentOpen &&
    paymentMethods.length > 0 &&
    !(paymentMethod === 'cash' && needsChange && changeForNumber < total);

  // Mark field as touched
  const markFieldTouched = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  // Real-time validation for new address
  useEffect(() => {
    if (showNewAddressForm && touchedFields.size > 0) {
      const errors: string[] = [];
      
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
    return !value?.trim() ? 'border-destructive focus-visible:ring-destructive' : '';
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-card border-border">
        {step === 'form' ? (
          <>
            <SheetHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <SheetTitle className="text-xl font-bold">Finalizar Pedido</SheetTitle>
                </div>
                
                {/* Status do estabelecimento */}
                {isEstablishmentOpen ? (
                  <span className="px-2 py-1 rounded-md bg-accent/15 text-accent text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Aberto
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-medium flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Fechado
                  </span>
                )}
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
                      placeholder="(11) 99999-9999"
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      className={`bg-secondary/50 ${
                        customerPhone.trim().length > 0 && !isPhoneValid 
                          ? 'border-destructive focus-visible:ring-destructive' 
                          : ''
                      }`}
                    />
                    {customerPhone.trim().length > 0 && !isPhoneValid && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Telefone inválido (digite 10-11 dígitos)
                      </p>
                    )}
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
                      {addresses.map((addr) => {
                        const isSelected = deliveryAddressType === 'saved' && selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20' 
                                : 'border-border bg-secondary/30 hover:bg-secondary/50 hover:border-muted-foreground'
                            }`}
                          >
                            <div className={`h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {isSelected && (
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
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
                        );
                      })}
                      
                    </div>
                  </div>
                ) : null}

                {/* New address form */}
                {(showNewAddressForm || addresses.length === 0) && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border animate-fade-in">
                    {/* Mapbox Autocomplete */}
                    <div className="space-y-2">
                      <Label>Buscar endereço</Label>
                      <AddressAutocomplete
                        placeholder="Digite o endereço completo..."
                        onAddressSelect={handleAddressSelect}
                      />
                      <p className="text-xs text-muted-foreground">
                        Busque e selecione seu endereço, ou preencha manualmente abaixo
                      </p>
                    </div>
                    
                    <Separator className="my-3" />
                    
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

                    <div className="space-y-2">
                      <Label htmlFor="checkout-cep">CEP (opcional)</Label>
                      <Input
                        id="checkout-cep"
                        placeholder="00000-000"
                        value={newAddress.zip_code}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, zip_code: e.target.value }))}
                        className="bg-background"
                      />
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
                
                {/* Alerta quando estabelecimento fechado */}
                {!isEstablishmentOpen && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="font-medium text-destructive">Estabelecimento Fechado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Não é possível fazer pedidos no momento
                    </p>
                  </div>
                )}
                
                {isLoadingPaymentMethods ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Nenhuma forma de pagamento disponível</p>
                  </div>
                ) : (
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
                )}

                {/* Cash change options */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="needs-change"
                        checked={needsChange}
                        onCheckedChange={(checked) => setNeedsChange(checked === true)}
                      />
                      <Label htmlFor="needs-change" className="cursor-pointer">Preciso de troco</Label>
                    </div>
                    
                    {needsChange && (
                      <div className="space-y-2">
                        <Label htmlFor="change-for">Troco para quanto?</Label>
                        <div className="relative">
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="change-for"
                            type="number"
                            placeholder="0,00"
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value)}
                            className="pl-9 bg-background"
                          />
                        </div>
                        {changeForNumber > 0 && changeForNumber >= total && (
                          <p className="text-xs text-muted-foreground">
                            Troco: <span className="font-medium text-foreground">R$ {changeAmount.toFixed(2)}</span>
                          </p>
                        )}
                        {changeForNumber > 0 && changeForNumber < total && (
                          <p className="text-xs text-destructive">
                            O valor deve ser maior que o total do pedido (R$ {total.toFixed(2)})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Coupon Code */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Cupom de desconto
                </h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      <div>
                        <p className="font-medium text-sm text-accent">{appliedCoupon.code}</p>
                        <p className="text-xs text-muted-foreground">{appliedCoupon.description}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={removeCoupon}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="bg-secondary/50 uppercase"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                    >
                      {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Order Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Sem cebola, apartamento 101..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-secondary/50 min-h-[80px]"
                />
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">Resumo do pedido</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      {isCalculatingFee && <Loader2 className="h-3 w-3 animate-spin" />}
                      {deliveryDistance !== null && (
                        <span className="text-xs text-muted-foreground">({deliveryDistance.toFixed(1)} km)</span>
                      )}
                    </div>
                    {isOutsideDeliveryArea ? (
                      <span className="text-destructive font-medium">Fora da área</span>
                    ) : (
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                  
                  {/* Coupon discount */}
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Cupom ({appliedCoupon.code})
                      </span>
                      <span>-R$ {couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Outside delivery area warning */}
                  {isOutsideDeliveryArea && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
                      <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Endereço fora da área de entrega
                      </div>
                      <p className="text-xs text-destructive/80 mt-1">
                        A distância do seu endereço ({deliveryDistance?.toFixed(1)} km) excede o raio máximo de entrega ({config.establishment.maxDeliveryRadius} km).
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold text-lg pt-2">
                    <span>Total</span>
                    <span className={isOutsideDeliveryArea ? "text-muted-foreground" : "text-primary"}>
                      {isOutsideDeliveryArea ? "—" : `R$ ${total.toFixed(2)}`}
                    </span>
                  </div>
                  
                  {/* ETA Display */}
                  {estimatedTime && !isOutsideDeliveryArea && (
                    <div className="flex items-center justify-center gap-2 pt-3 mt-2 border-t border-border">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Entrega estimada: <span className="font-semibold text-primary">{estimatedTime}</span>
                      </span>
                      {isCalculatingETA && <Loader2 className="h-3 w-3 animate-spin" />}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card space-y-2">
              {!isEstablishmentOpen && (
                <div className="text-xs text-center text-destructive font-medium">
                  <p>Estabelecimento fechado no momento</p>
                  {nextOpeningTime && (
                    <p className="text-muted-foreground mt-1">{nextOpeningTime}</p>
                  )}
                </div>
              )}
              {isOutsideDeliveryArea && isEstablishmentOpen && (
                <p className="text-xs text-center text-destructive">
                  Não é possível finalizar: endereço fora da área de entrega
                </p>
              )}
              <Button 
                className="w-full h-12 text-base font-semibold" 
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder || isPlacingOrder || isCreatingPayment}
              >
                {isPlacingOrder || isCreatingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : !isEstablishmentOpen ? (
                  'Estabelecimento Fechado'
                ) : isOutsideDeliveryArea ? (
                  'Fora da Área de Entrega'
                ) : (
                  'Confirmar Pedido'
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-6 animate-scale-in">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pedido Confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              Seu pedido foi recebido e está sendo preparado.
            </p>
            <div className="bg-secondary/50 rounded-lg p-4 w-full max-w-xs">
              <p className="text-sm text-muted-foreground mb-1">Tempo estimado de entrega</p>
              <p className="text-2xl font-bold text-primary">
                {estimatedTime || `${config.establishment.estimatedDeliveryTime} min`}
              </p>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Payment Modal for Online Payments */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderId={currentOrderId}
        orderNumber={currentOrderNumber || undefined}
        amount={currentPaymentAmount || total}
        paymentType={currentPaymentType}
        qrCode={paymentResult?.qr_code}
        qrCodeBase64={paymentResult?.qr_code_base64}
        checkoutUrl={paymentResult?.checkout_url}
        onPaymentApproved={handlePaymentApproved}
        isLoading={paymentState === 'creating'}
        hasError={isPaymentError}
        errorMessage={paymentErrorMessage}
        onRetry={handleRetryPayment}
      />
    </Sheet>
  );
}
