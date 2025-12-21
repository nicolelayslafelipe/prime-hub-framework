-- Add coupon tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN coupon_code text,
ADD COLUMN coupon_discount numeric DEFAULT 0;

-- Create index for coupon analytics
CREATE INDEX idx_orders_coupon_code ON public.orders(coupon_code) WHERE coupon_code IS NOT NULL;