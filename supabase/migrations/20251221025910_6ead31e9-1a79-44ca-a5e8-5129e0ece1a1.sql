-- Add ETA configuration to establishment_settings
ALTER TABLE public.establishment_settings 
ADD COLUMN IF NOT EXISTS average_prep_time integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS peak_time_adjustment integer DEFAULT 10;