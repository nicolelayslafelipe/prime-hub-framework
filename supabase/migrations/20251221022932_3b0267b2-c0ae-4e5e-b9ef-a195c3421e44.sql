-- Adicionar colunas de coordenadas na tabela addresses
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Tornar zip_code opcional
ALTER TABLE public.addresses ALTER COLUMN zip_code DROP NOT NULL;

-- Adicionar colunas de coordenadas na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS customer_longitude DECIMAL(11, 8);