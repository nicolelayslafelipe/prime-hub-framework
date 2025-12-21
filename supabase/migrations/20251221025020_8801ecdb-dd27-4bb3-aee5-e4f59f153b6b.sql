-- Add distance-based delivery fee configuration to establishment_settings
ALTER TABLE public.establishment_settings 
ADD COLUMN IF NOT EXISTS distance_fee_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS base_delivery_fee numeric DEFAULT 5,
ADD COLUMN IF NOT EXISTS price_per_km numeric DEFAULT 2,
ADD COLUMN IF NOT EXISTS min_distance_included numeric DEFAULT 2,
ADD COLUMN IF NOT EXISTS establishment_latitude numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS establishment_longitude numeric DEFAULT NULL;