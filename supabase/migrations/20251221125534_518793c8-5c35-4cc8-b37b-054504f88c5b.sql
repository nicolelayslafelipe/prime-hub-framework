-- Add rating fields to establishment_settings
ALTER TABLE establishment_settings
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;