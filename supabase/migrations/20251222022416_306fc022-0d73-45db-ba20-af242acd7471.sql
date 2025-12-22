-- Corrigir a view para usar SECURITY INVOKER (usa permissões do usuário que consulta)
DROP VIEW IF EXISTS establishment_public;

-- Recriar view com security_invoker = true (padrão seguro)
-- Isso garante que RLS seja aplicado baseado no usuário que faz a query
CREATE VIEW public.establishment_public AS
SELECT 
  id,
  name,
  description,
  logo,
  banner,
  banner_text,
  is_open,
  is_delivery_enabled,
  estimated_delivery_time,
  min_order_value,
  delivery_fee,
  primary_color,
  accent_color,
  selected_theme,
  show_banner,
  use_gradient,
  use_banner_as_login_bg,
  city,
  state,
  neighborhood,
  average_rating,
  total_reviews,
  average_prep_time
FROM establishment_settings;

-- Para que usuários anônimos possam ver a view, precisamos criar uma policy 
-- que permita SELECT na tabela base apenas para esses campos específicos
-- OU usar uma função security definer para expor os dados públicos

-- Opção mais segura: Criar uma função security definer que retorna dados públicos
CREATE OR REPLACE FUNCTION public.get_public_establishment_info()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo text,
  banner text,
  banner_text text,
  is_open boolean,
  is_delivery_enabled boolean,
  estimated_delivery_time integer,
  min_order_value numeric,
  delivery_fee numeric,
  primary_color text,
  accent_color text,
  selected_theme text,
  show_banner boolean,
  use_gradient boolean,
  use_banner_as_login_bg boolean,
  city text,
  state text,
  neighborhood text,
  average_rating numeric,
  total_reviews integer,
  average_prep_time integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    description,
    logo,
    banner,
    banner_text,
    is_open,
    is_delivery_enabled,
    estimated_delivery_time,
    min_order_value,
    delivery_fee,
    primary_color,
    accent_color,
    selected_theme,
    show_banner,
    use_gradient,
    use_banner_as_login_bg,
    city,
    state,
    neighborhood,
    average_rating,
    total_reviews,
    average_prep_time
  FROM establishment_settings
  LIMIT 1;
$$;

-- Permitir que todos executem a função
GRANT EXECUTE ON FUNCTION public.get_public_establishment_info() TO anon, authenticated;