-- Add Mercado Pago payment fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mp_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mp_preference_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mp_qr_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mp_checkout_url text;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON public.orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);