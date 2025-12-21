-- Add column to control using banner as login background
ALTER TABLE establishment_settings
ADD COLUMN IF NOT EXISTS use_banner_as_login_bg boolean DEFAULT true;