import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PDVCartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
}

interface PDVContextType {
  items: PDVCartItem[];
  addItem: (item: Omit<PDVCartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const PDVContext = createContext<PDVContextType | undefined>(undefined);

export function PDVProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PDVCartItem[]>([]);

  const addItem = useCallback((item: Omit<PDVCartItem, 'quantity'>) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.productId === item.productId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId));
    } else {
      setItems(prev => prev.map(i => 
        i.productId === productId ? { ...i, quantity } : i
      ));
    }
  }, []);

  const updateNotes = useCallback((productId: string, notes: string) => {
    setItems(prev => prev.map(i => 
      i.productId === productId ? { ...i, notes } : i
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  return (
    <PDVContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateNotes,
      clearCart,
      getTotal,
      getItemCount,
    }}>
      {children}
    </PDVContext.Provider>
  );
}

export function usePDV() {
  const context = useContext(PDVContext);
  if (!context) {
    throw new Error('usePDV must be used within a PDVProvider');
  }
  return context;
}
