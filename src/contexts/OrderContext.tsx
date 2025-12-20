import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, OrderStatus } from '@/types';

// Mock orders for demonstration
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 1001,
    customerId: 'c1',
    customerName: 'João Silva',
    customerPhone: '(11) 98888-7777',
    customerAddress: 'Rua das Flores, 456 - Apt 12',
    items: [
      { id: 'i1', productId: 'p1', productName: 'X-Burger Especial', quantity: 2, unitPrice: 28.90 },
      { id: 'i2', productId: 'p2', productName: 'Batata Frita Grande', quantity: 1, unitPrice: 15.90 },
    ],
    status: 'pending',
    subtotal: 73.70,
    deliveryFee: 5.00,
    total: 78.70,
    paymentMethod: 'Cartão de Crédito',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '2',
    orderNumber: 1002,
    customerId: 'c2',
    customerName: 'Maria Santos',
    customerPhone: '(11) 97777-6666',
    customerAddress: 'Av. Brasil, 789 - Casa',
    items: [
      { id: 'i3', productId: 'p3', productName: 'Pizza Margherita', quantity: 1, unitPrice: 45.90 },
      { id: 'i4', productId: 'p4', productName: 'Refrigerante 2L', quantity: 1, unitPrice: 12.00 },
    ],
    status: 'preparing',
    subtotal: 57.90,
    deliveryFee: 5.00,
    total: 62.90,
    paymentMethod: 'PIX',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '3',
    orderNumber: 1003,
    customerId: 'c3',
    customerName: 'Carlos Oliveira',
    customerPhone: '(11) 96666-5555',
    customerAddress: 'Rua Augusta, 1234 - Apt 45',
    items: [
      { id: 'i5', productId: 'p5', productName: 'Combo Família', quantity: 1, unitPrice: 89.90 },
    ],
    status: 'ready',
    subtotal: 89.90,
    deliveryFee: 0,
    total: 89.90,
    paymentMethod: 'Dinheiro',
    notes: 'Troco para R$ 100',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '4',
    orderNumber: 1004,
    customerId: 'c4',
    customerName: 'Ana Costa',
    customerPhone: '(11) 95555-4444',
    customerAddress: 'Rua Oscar Freire, 567',
    items: [
      { id: 'i6', productId: 'p6', productName: 'Açaí 500ml', quantity: 2, unitPrice: 22.00 },
      { id: 'i7', productId: 'p7', productName: 'Granola Extra', quantity: 2, unitPrice: 3.00 },
    ],
    status: 'out_for_delivery',
    subtotal: 50.00,
    deliveryFee: 5.00,
    total: 55.00,
    paymentMethod: 'Cartão de Débito',
    motoboyId: 'm1',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
];

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  assignMotoboy: (orderId: string, motoboyId: string) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getPendingOrdersCount: () => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
  };

  const assignMotoboy = (orderId: string, motoboyId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, motoboyId, status: 'out_for_delivery', updatedAt: new Date() }
          : order
      )
    );
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  const getPendingOrdersCount = () => {
    return orders.filter((order) => order.status === 'pending').length;
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        assignMotoboy,
        getOrdersByStatus,
        getPendingOrdersCount,
      }}
    >
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
