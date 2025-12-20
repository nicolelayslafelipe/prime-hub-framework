import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus, OrderItem } from '@/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface DbOrder {
  id: string;
  order_number: number;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  notes: string | null;
  motoboy_id: string | null;
  created_at: string;
  updated_at: string;
  needs_change: boolean | null;
  change_for: number | null;
  change_amount: number | null;
}

interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  additions: string[] | null;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const mapDbOrderToOrder = (dbOrder: DbOrder, items: OrderItem[]): Order => ({
  id: dbOrder.id,
  orderNumber: dbOrder.order_number,
  customerId: dbOrder.customer_id,
  customerName: dbOrder.customer_name,
  customerPhone: dbOrder.customer_phone,
  customerAddress: dbOrder.customer_address,
  status: dbOrder.status as OrderStatus,
  subtotal: Number(dbOrder.subtotal),
  deliveryFee: Number(dbOrder.delivery_fee),
  total: Number(dbOrder.total),
  paymentMethod: dbOrder.payment_method,
  notes: dbOrder.notes || undefined,
  motoboyId: dbOrder.motoboy_id || undefined,
  createdAt: new Date(dbOrder.created_at),
  updatedAt: new Date(dbOrder.updated_at),
  items,
  needsChange: dbOrder.needs_change || false,
  changeFor: dbOrder.change_for ? Number(dbOrder.change_for) : undefined,
  changeAmount: dbOrder.change_amount ? Number(dbOrder.change_amount) : undefined,
});

const mapDbItemToOrderItem = (dbItem: DbOrderItem): OrderItem => ({
  id: dbItem.id,
  productId: dbItem.product_id,
  productName: dbItem.product_name,
  quantity: dbItem.quantity,
  unitPrice: Number(dbItem.unit_price),
  notes: dbItem.notes || undefined,
  additions: dbItem.additions || undefined,
});

interface UseRealtimeOrdersOptions {
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (order: Order) => void;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const { onNewOrder, onOrderUpdate } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Fetch all orders with their items
  const fetchOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) throw itemsError;

      const itemsByOrderId = (itemsData || []).reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(mapDbItemToOrderItem(item as DbOrderItem));
        return acc;
      }, {} as Record<string, OrderItem[]>);

      const mappedOrders = (ordersData || []).map((order) =>
        mapDbOrderToOrder(order as DbOrder, itemsByOrderId[order.id] || [])
      );

      setOrders(mappedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle realtime order changes
  const handleOrderChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<DbOrder>) => {
      console.log('Realtime order change:', payload.eventType, payload);

      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new as DbOrder;
        
        // Fetch items for the new order
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', newOrder.id);

        const items = (itemsData || []).map((item) => mapDbItemToOrderItem(item as DbOrderItem));
        const mappedOrder = mapDbOrderToOrder(newOrder, items);

        setOrders((prev) => [mappedOrder, ...prev]);
        
        // Call onNewOrder callback
        onNewOrder?.(mappedOrder);
      } else if (payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new as DbOrder;

        setOrders((prev) =>
          prev.map((order) => {
            if (order.id === updatedOrder.id) {
              const updated = { ...order, ...mapDbOrderToOrder(updatedOrder, order.items) };
              // Call onOrderUpdate callback
              onOrderUpdate?.(updated);
              return updated;
            }
            return order;
          })
        );
      } else if (payload.eventType === 'DELETE') {
        const deletedOrder = payload.old as DbOrder;
        setOrders((prev) => prev.filter((order) => order.id !== deletedOrder.id));
      }
    },
    [onNewOrder, onOrderUpdate]
  );

  // Setup realtime subscription
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        handleOrderChange
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, handleOrderChange]);

  // Add a new order
  const addOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: orderData.customerId,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          customer_address: orderData.customerAddress,
          status: orderData.status,
          subtotal: orderData.subtotal,
          delivery_fee: orderData.deliveryFee,
          total: orderData.total,
          payment_method: orderData.paymentMethod,
          notes: orderData.notes || null,
          motoboy_id: orderData.motoboyId || null,
          needs_change: orderData.needsChange || false,
          change_for: orderData.changeFor || null,
          change_amount: orderData.changeAmount || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item) => ({
          order_id: newOrder.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          notes: item.notes || null,
          additions: item.additions || null,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return newOrder;
    } catch (err) {
      console.error('Error adding order:', err);
      throw err;
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  // Assign motoboy to order
  const assignMotoboy = async (orderId: string, motoboyId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          motoboy_id: motoboyId, 
          status: 'out_for_delivery' 
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (err) {
      console.error('Error assigning motoboy:', err);
      throw err;
    }
  };

  // Get orders by status
  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  // Get pending orders count
  const getPendingOrdersCount = () => {
    return orders.filter((order) => order.status === 'pending').length;
  };

  return {
    orders,
    isLoading,
    error,
    connectionStatus,
    addOrder,
    updateOrderStatus,
    assignMotoboy,
    getOrdersByStatus,
    getPendingOrdersCount,
    refetch: fetchOrders,
  };
}
