-- Add new fields for location and appearance
ALTER TABLE public.establishment_settings
ADD COLUMN IF NOT EXISTS city text DEFAULT 'São Paulo',
ADD COLUMN IF NOT EXISTS state text DEFAULT 'SP',
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#34d399',
ADD COLUMN IF NOT EXISTS use_gradient boolean DEFAULT false;