-- Create sound_settings table for configurable sound preferences
CREATE TABLE public.sound_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_type TEXT NOT NULL CHECK (panel_type IN ('admin', 'kitchen')),
  enabled BOOLEAN DEFAULT true,
  sound_type TEXT DEFAULT 'bell',
  volume DECIMAL(3,2) DEFAULT 0.7 CHECK (volume >= 0 AND volume <= 1),
  min_interval_seconds INTEGER DEFAULT 3,
  repeat_enabled BOOLEAN DEFAULT false,
  repeat_interval_seconds INTEGER DEFAULT 30,
  max_repeat_duration_seconds INTEGER DEFAULT 300,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(panel_type)
);

-- Enable RLS
ALTER TABLE public.sound_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (settings are global for the establishment)
CREATE POLICY "Allow public read access to sound_settings"
ON public.sound_settings FOR SELECT
USING (true);

-- Only admins can update sound settings
CREATE POLICY "Admins can update sound_settings"
ON public.sound_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert sound settings
CREATE POLICY "Admins can insert sound_settings"
ON public.sound_settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default settings for admin and kitchen panels
INSERT INTO public.sound_settings (panel_type, enabled, sound_type, volume, min_interval_seconds, repeat_enabled, repeat_interval_seconds, max_repeat_duration_seconds)
VALUES 
  ('admin', true, 'bell', 0.7, 3, false, 30, 300),
  ('kitchen', true, 'kitchen-bell', 0.8, 3, true, 30, 300);

-- Create trigger for updated_at
CREATE TRIGGER update_sound_settings_updated_at
  BEFORE UPDATE ON public.sound_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();