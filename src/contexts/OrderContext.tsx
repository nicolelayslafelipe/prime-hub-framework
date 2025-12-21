import React, { createContext, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Order, OrderStatus, SoundEventType } from '@/types';
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

  // Handle new order - triggered when a new order is inserted
  const handleNewOrder = useCallback((order: Order) => {
    console.log('[Order] New order received:', order.orderNumber, 'status:', order.status);
    
    // Skip sound on initial load (existing orders)
    if (initialLoadRef.current) {
      console.log('[Order] Skipping sound - initial load');
      return;
    }

    // New pending order → Admin notification
    if (order.status === 'pending') {
      console.log('[Order] Playing new_order sound for admin');
      const played = soundContext.playSoundForEvent('new_order', order.id, 'admin');
      if (played) {
        soundContext.markOrderAsAlerted(order.id, 'admin');
      }

      // Also notify kitchen about new order
      console.log('[Order] Playing order_to_kitchen sound');
      const kitchenPlayed = soundContext.playSoundForEvent('order_to_kitchen', order.id, 'kitchen');
      if (kitchenPlayed) {
        soundContext.markOrderAsAlerted(order.id, 'kitchen');
        // Start kitchen repeat if enabled
        soundContext.startKitchenRepeat(order.id);
      }
    }

    // If order starts as confirmed (e.g., PDV), also notify kitchen
    if (order.status === 'confirmed') {
      console.log('[Order] Confirmed order - notifying kitchen');
      const kitchenPlayed = soundContext.playSoundForEvent('order_to_kitchen', order.id, 'kitchen');
      if (kitchenPlayed) {
        soundContext.markOrderAsAlerted(order.id, 'kitchen');
        soundContext.startKitchenRepeat(order.id);
      }
    }
  }, [soundContext]);

  // Handle order update - triggered when an order is updated
  const handleOrderUpdate = useCallback((order: Order, oldStatus?: OrderStatus) => {
    console.log('[Order] Order updated:', order.orderNumber, 'from:', oldStatus, 'to:', order.status);

    // Skip sound on initial load
    if (initialLoadRef.current) {
      return;
    }

    // Order moved from pending to confirmed (payment confirmed or admin action)
    if (oldStatus === 'pending' && order.status === 'confirmed') {
      console.log('[Order] Order confirmed - notifying admin');
      soundContext.playSoundForEvent('order_paid', order.id, 'admin');
    }

    // Order moved to preparing - notify kitchen
    if (order.status === 'preparing' && oldStatus !== 'preparing') {
      console.log('[Order] Order preparing - notifying kitchen');
      const played = soundContext.playSoundForEvent('order_to_kitchen', order.id, 'kitchen');
      if (played) {
        soundContext.markOrderAsAlerted(order.id, 'kitchen');
      }
    }

    // Order is ready - notify admin and motoboy
    if (order.status === 'ready' && oldStatus !== 'ready') {
      console.log('[Order] Order ready - notifying admin and motoboy');
      soundContext.playSoundForEvent('order_ready', order.id, 'admin');
      soundContext.playSoundForEvent('motoboy_available', order.id, 'motoboy');
      
      // Stop kitchen repeat when order is ready
      soundContext.stopKitchenRepeat();
    }

    // Order out for delivery - motoboy assigned
    if (order.status === 'out_for_delivery' && oldStatus !== 'out_for_delivery') {
      console.log('[Order] Order out for delivery - notifying admin and motoboy');
      soundContext.playSoundForEvent('order_delivering', order.id, 'admin');
      soundContext.playSoundForEvent('motoboy_assigned', order.id, 'motoboy');
    }

    // Order delivered
    if (order.status === 'delivered' && oldStatus !== 'delivered') {
      console.log('[Order] Order delivered - notifying admin');
      soundContext.playSoundForEvent('order_delivered', order.id, 'admin');
    }

    // Order cancelled - notify all panels
    if (order.status === 'cancelled' && oldStatus !== 'cancelled') {
      console.log('[Order] Order cancelled - notifying all panels');
      soundContext.playSoundForEvent('order_cancelled', order.id, 'admin');
      soundContext.playSoundForEvent('order_cancelled', order.id, 'kitchen');
      soundContext.stopKitchenRepeat();
    }

    // Stop kitchen repeat when order moves past pending/preparing/confirmed
    if (!['pending', 'preparing', 'confirmed'].includes(order.status)) {
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
        console.log('[Order] Initial load complete, sounds enabled');
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
