import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/data/mockProducts';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
  getDeliveryFee: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(5);

  // Fetch delivery fee from establishment settings
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const { data, error } = await supabase
          .from('establishment_settings')
          .select('delivery_fee, distance_fee_enabled, base_delivery_fee')
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching delivery fee:', error);
          return;
        }

        if (data) {
          // Use base_delivery_fee if distance_fee_enabled, otherwise use delivery_fee
          const fee = data.distance_fee_enabled 
            ? (data.base_delivery_fee || 5)
            : (data.delivery_fee || 5);
          setDeliveryFee(fee);
        }
      } catch (err) {
        console.error('Error fetching delivery settings:', err);
      }
    };

    fetchDeliveryFee();
  }, []);

  const addItem = (product: Product, quantity = 1, notes?: string) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return deliveryFee;
  };

  const getTotal = () => {
    return getSubtotal() + deliveryFee;
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getSubtotal,
        getItemCount,
        getDeliveryFee,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
