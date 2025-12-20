import React, { createContext, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '@/types';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useSound } from '@/contexts/SoundContext';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  connectionStatus: ConnectionStatus;
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<unknown>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignMotoboy: (orderId: string, motoboyId: string) => Promise<void>;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPendingOrdersCount: () => number;
  refetch: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const soundContext = useSound();
  const initialLoadRef = useRef(true);

  const handleNewOrder = useCallback((order: Order) => {
    console.log('New order received:', order.orderNumber);
    
    // Skip sound on initial load (existing orders)
    if (initialLoadRef.current) {
      return;
    }
    
    // Play sound for new pending orders (admin panel)
    if (order.status === 'pending') {
      const played = soundContext.playSound('admin', order.id);
      if (played) {
        soundContext.markOrderAsAlerted(order.id);
        console.log('Admin sound played for order:', order.id);
      }
    }
  }, [soundContext]);

  const handleOrderUpdate = useCallback((order: Order) => {
    // Kitchen panel: play sound for pending/preparing orders
    if (order.status === 'pending' || order.status === 'preparing') {
      const played = soundContext.playSound('kitchen', order.id);
      if (played) {
        soundContext.markOrderAsAlerted(order.id);
        
        // Start kitchen repeat if enabled
        if (order.status === 'pending') {
          soundContext.startKitchenRepeat(order.id);
        }
        
        console.log('Kitchen sound played for order:', order.id);
      }
    }
    
    // Stop kitchen repeat when order moves past pending/preparing
    if (order.status !== 'pending' && order.status !== 'preparing') {
      soundContext.stopKitchenRepeat();
    }
  }, [soundContext]);

  const realtimeOrders = useRealtimeOrders({
    onNewOrder: handleNewOrder,
    onOrderUpdate: handleOrderUpdate,
  });

  // Mark initial load as complete after first orders fetch
  useEffect(() => {
    if (!realtimeOrders.isLoading && realtimeOrders.orders.length >= 0) {
      // Use a small delay to ensure we're past the initial load
      const timer = setTimeout(() => {
        initialLoadRef.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [realtimeOrders.isLoading, realtimeOrders.orders.length]);

  return (
    <OrderContext.Provider value={realtimeOrders}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
