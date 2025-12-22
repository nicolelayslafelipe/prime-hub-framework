-- 1. Criar view pública segura para establishment_settings (só campos públicos)
CREATE OR REPLACE VIEW public.establishment_public AS
SELECT 
  id, 
  name, 
  description, 
  logo, 
  banner, 
  is_open,
  is_delivery_enabled,
  estimated_delivery_time, 
  min_order_value,
  delivery_fee,
  base_delivery_fee,
  price_per_km,
  distance_fee_enabled,
  min_distance_included,
  max_delivery_radius,
  primary_color, 
  accent_color,
  selected_theme,
  show_banner,
  banner_text,
  use_gradient,
  use_banner_as_login_bg,
  city,
  state,
  neighborhood,
  average_rating,
  total_reviews,
  average_prep_time
FROM establishment_settings;

-- Permitir SELECT público na view
GRANT SELECT ON public.establishment_public TO anon, authenticated;

-- 2. Remover policy insegura que permite INSERT para qualquer um em admin_notifications
DROP POLICY IF EXISTS "Allow insert for triggers" ON public.admin_notifications;