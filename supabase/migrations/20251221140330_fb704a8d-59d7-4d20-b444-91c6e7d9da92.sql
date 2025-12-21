-- Add selected_theme column to establishment_settings
ALTER TABLE public.establishment_settings
ADD COLUMN IF NOT EXISTS selected_theme text DEFAULT 'premium-dark';

-- Update existing rows to have the default theme
UPDATE public.establishment_settings
SET selected_theme = 'premium-dark'
WHERE selected_theme IS NULL;