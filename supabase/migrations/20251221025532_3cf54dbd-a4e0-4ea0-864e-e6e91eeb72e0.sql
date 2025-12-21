-- Add max delivery radius to establishment_settings
ALTER TABLE public.establishment_settings 
ADD COLUMN IF NOT EXISTS max_delivery_radius numeric DEFAULT 10;