import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderStatus, OrderItem } from '@/types';

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

export function useClientOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const orderIds = (ordersData || []).map(o => o.id);
      
      let itemsData: DbOrderItem[] = [];
      if (orderIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;
        itemsData = data || [];
      }

      const itemsByOrderId = itemsData.reduce((acc, item) => {
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
    } catch (err) {
      console.error('Error fetching client orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    fetchOrders();

    // Subscribe to realtime changes for this user's orders
    const channel = supabase
      .channel(`client-orders-${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `customer_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Client order realtime update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as DbOrder;
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', newOrder.id);

            const items = (itemsData || []).map((item) => mapDbItemToOrderItem(item as DbOrderItem));
            const mappedOrder = mapDbOrderToOrder(newOrder, items);
            setOrders((prev) => [mappedOrder, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as DbOrder;
            setOrders((prev) =>
              prev.map((order) => {
                if (order.id === updatedOrder.id) {
                  return { ...order, ...mapDbOrderToOrder(updatedOrder, order.items) };
                }
                return order;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as { id: string };
            setOrders((prev) => prev.filter((order) => order.id !== deletedOrder.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Client orders subscription status:', status);
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
  }, [userId, fetchOrders]);

  const getLatestOrder = () => {
    return orders[0] || null;
  };

  const getOrderById = (orderId: string) => {
    return orders.find(o => o.id === orderId) || null;
  };

  return {
    orders,
    isLoading,
    connectionStatus,
    getLatestOrder,
    getOrderById,
    refetch: fetchOrders,
  };
}
