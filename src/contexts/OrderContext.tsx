import React, { createContext, useContext, ReactNode } from 'react';
import { Order, OrderStatus } from '@/types';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

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
  const realtimeOrders = useRealtimeOrders();

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
