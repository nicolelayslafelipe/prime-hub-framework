-- Create delivery_zones table
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  fee numeric DEFAULT 0,
  min_order numeric DEFAULT 0,
  estimated_time integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active delivery_zones"
ON public.delivery_zones FOR SELECT
USING (true);

CREATE POLICY "Admins can insert delivery_zones"
ON public.delivery_zones FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update delivery_zones"
ON public.delivery_zones FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete delivery_zones"
ON public.delivery_zones FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add delivery_area column to establishment_settings if not exists
ALTER TABLE public.establishment_settings 
ADD COLUMN IF NOT EXISTS delivery_area text;