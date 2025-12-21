-- Drop existing check constraint and add updated one with motoboy
ALTER TABLE public.sound_settings DROP CONSTRAINT IF EXISTS sound_settings_panel_type_check;

-- Add new check constraint that includes motoboy
ALTER TABLE public.sound_settings ADD CONSTRAINT sound_settings_panel_type_check 
CHECK (panel_type IN ('admin', 'kitchen', 'motoboy'));

-- Add motoboy sound settings if not exists
INSERT INTO public.sound_settings (panel_type, enabled, sound_type, volume, min_interval_seconds, repeat_enabled, repeat_interval_seconds, max_repeat_duration_seconds)
SELECT 'motoboy', true, 'alert', 0.8, 3, false, 30, 300
WHERE NOT EXISTS (SELECT 1 FROM public.sound_settings WHERE panel_type = 'motoboy');