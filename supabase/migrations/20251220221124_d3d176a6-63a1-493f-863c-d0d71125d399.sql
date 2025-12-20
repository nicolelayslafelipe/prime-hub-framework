-- Adicionar campos de troco na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS needs_change BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS change_for NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS change_amount NUMERIC(10,2);