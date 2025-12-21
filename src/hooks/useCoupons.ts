import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

interface CouponValidationResult {
  isValid: boolean;
  coupon: Coupon | null;
  discount: number;
  errorMessage: string | null;
}

export function useCoupons() {
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);

  const validateCoupon = useCallback(async (
    code: string, 
    orderSubtotal: number
  ): Promise<CouponValidationResult> => {
    if (!code.trim()) {
      return { isValid: false, coupon: null, discount: 0, errorMessage: 'Digite um código de cupom' };
    }

    setIsValidating(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        return { isValid: false, coupon: null, discount: 0, errorMessage: 'Cupom inválido ou expirado' };
      }

      // Check validity period
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { isValid: false, coupon: null, discount: 0, errorMessage: 'Este cupom ainda não está válido' };
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { isValid: false, coupon: null, discount: 0, errorMessage: 'Este cupom expirou' };
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return { isValid: false, coupon: null, discount: 0, errorMessage: 'Este cupom atingiu o limite de uso' };
      }

      // Check minimum order value
      if (coupon.min_order_value && orderSubtotal < coupon.min_order_value) {
        return { 
          isValid: false, 
          coupon: null, 
          discount: 0, 
          errorMessage: `Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2)} para usar este cupom` 
        };
      }

      // Calculate discount
      let calculatedDiscount = 0;
      if (coupon.discount_type === 'percentage') {
        calculatedDiscount = (orderSubtotal * coupon.discount_value) / 100;
        // Apply max discount cap if exists
        if (coupon.max_discount && calculatedDiscount > coupon.max_discount) {
          calculatedDiscount = coupon.max_discount;
        }
      } else {
        calculatedDiscount = coupon.discount_value;
      }

      // Discount can't be more than subtotal
      calculatedDiscount = Math.min(calculatedDiscount, orderSubtotal);

      return { 
        isValid: true, 
        coupon: coupon as Coupon, 
        discount: calculatedDiscount, 
        errorMessage: null 
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { isValid: false, coupon: null, discount: 0, errorMessage: 'Erro ao validar cupom' };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const applyCoupon = useCallback(async (code: string, orderSubtotal: number): Promise<boolean> => {
    const result = await validateCoupon(code, orderSubtotal);

    if (result.isValid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setDiscount(result.discount);
      toast.success('Cupom aplicado!', {
        description: result.coupon.description || `Desconto de R$ ${result.discount.toFixed(2)}`,
      });
      return true;
    } else {
      toast.error('Cupom inválido', {
        description: result.errorMessage,
      });
      return false;
    }
  }, [validateCoupon]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscount(0);
    toast.info('Cupom removido');
  }, []);

  const incrementCouponUsage = useCallback(async (couponId: string): Promise<boolean> => {
    try {
      // Get current usage count and increment
      const { data: currentCoupon, error: fetchError } = await supabase
        .from('coupons')
        .select('usage_count')
        .eq('id', couponId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('coupons')
        .update({ usage_count: (currentCoupon?.usage_count || 0) + 1 })
        .eq('id', couponId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
      return false;
    }
  }, []);

  return {
    isValidating,
    appliedCoupon,
    discount,
    validateCoupon,
    applyCoupon,
    removeCoupon,
    incrementCouponUsage,
  };
}
