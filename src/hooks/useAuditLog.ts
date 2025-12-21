import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'soft_delete_user'
  | 'hard_delete_user'
  | 'toggle_user_status'
  | 'update_role'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'toggle_product'
  | 'create_category'
  | 'update_category'
  | 'delete_category'
  | 'create_coupon'
  | 'update_coupon'
  | 'delete_coupon'
  | 'toggle_coupon'
  | 'update_order_status'
  | 'delete_order'
  | 'assign_motoboy'
  | 'update_settings'
  | 'update_credentials'
  | 'update_payment_methods'
  | 'update_delivery_zones'
  | 'update_business_hours'
  | 'login_success'
  | 'login_failed'
  | 'logout';

export type AuditResource = 
  | 'users'
  | 'products'
  | 'categories'
  | 'coupons'
  | 'orders'
  | 'settings'
  | 'payment_methods'
  | 'delivery_zones'
  | 'business_hours'
  | 'credentials'
  | 'auth';

interface AuditLogEntry {
  action: AuditAction;
  resource: AuditResource;
  details?: Record<string, unknown>;
}

export function useAuditLog() {
  const logAction = useCallback(async (entry: AuditLogEntry): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Audit log skipped: No authenticated user');
        return false;
      }

      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          resource: entry.resource,
          details: {
            ...entry.details,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) {
        console.error('Failed to create audit log:', error);
        return false;
      }

      console.log(`Audit log created: ${entry.action} on ${entry.resource}`);
      return true;
    } catch (err) {
      console.error('Error creating audit log:', err);
      return false;
    }
  }, []);

  const logUserAction = useCallback(async (
    action: 'toggle_user_status' | 'update_user',
    userId: string,
    userName: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource: 'users',
      details: {
        target_user_id: userId,
        target_name: userName,
        ...details,
      },
    });
  }, [logAction]);

  const logProductAction = useCallback(async (
    action: 'create_product' | 'update_product' | 'delete_product' | 'toggle_product',
    productId: string,
    productName: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource: 'products',
      details: {
        product_id: productId,
        product_name: productName,
        ...details,
      },
    });
  }, [logAction]);

  const logCategoryAction = useCallback(async (
    action: 'create_category' | 'update_category' | 'delete_category',
    categoryId: string,
    categoryName: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource: 'categories',
      details: {
        category_id: categoryId,
        category_name: categoryName,
        ...details,
      },
    });
  }, [logAction]);

  const logCouponAction = useCallback(async (
    action: 'create_coupon' | 'update_coupon' | 'delete_coupon' | 'toggle_coupon',
    couponId: string,
    couponCode: string,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource: 'coupons',
      details: {
        coupon_id: couponId,
        coupon_code: couponCode,
        ...details,
      },
    });
  }, [logAction]);

  const logOrderAction = useCallback(async (
    action: 'update_order_status' | 'delete_order' | 'assign_motoboy',
    orderId: string,
    orderNumber: number,
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action,
      resource: 'orders',
      details: {
        order_id: orderId,
        order_number: orderNumber,
        ...details,
      },
    });
  }, [logAction]);

  const logSettingsAction = useCallback(async (
    resource: 'settings' | 'payment_methods' | 'delivery_zones' | 'business_hours' | 'credentials',
    details?: Record<string, unknown>
  ) => {
    return logAction({
      action: 'update_settings',
      resource,
      details,
    });
  }, [logAction]);

  return {
    logAction,
    logUserAction,
    logProductAction,
    logCategoryAction,
    logCouponAction,
    logOrderAction,
    logSettingsAction,
  };
}
