-- =====================================================
-- FASE 1: REMOVER EXPOSIÇÃO PÚBLICA DE DADOS SENSÍVEIS
-- =====================================================

-- 1.1 Remover SELECT público de api_integrations (expõe configs e tokens)
DROP POLICY IF EXISTS "Anyone can view api_integrations" ON api_integrations;

CREATE POLICY "Only admins can view api_integrations" 
ON api_integrations FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.2 Remover SELECT público de integration_status (expõe dados de integrações)
DROP POLICY IF EXISTS "Anyone can view integration_status" ON integration_status;

CREATE POLICY "Only admins can view integration_status" 
ON integration_status FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.3 Restringir establishment_settings (tabela base só para admin)
DROP POLICY IF EXISTS "Anyone can view establishment settings" ON establishment_settings;

CREATE POLICY "Only admins can view full establishment_settings" 
ON establishment_settings FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FASE 2: RECRIAR VIEW PÚBLICA SEGURA
-- =====================================================

-- Drop a view existente
DROP VIEW IF EXISTS establishment_public;

-- Recriar view SEM campos sensíveis de pricing e coordenadas
CREATE VIEW public.establishment_public 
WITH (security_invoker = false)
AS
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
  delivery_fee,  -- Taxa fixa visível (necessário para checkout básico)
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
  -- REMOVIDOS (dados sensíveis):
  -- phone, whatsapp, address, zip_code (dados de contato privados)
  -- base_delivery_fee, price_per_km, distance_fee_enabled (algoritmos de pricing)
  -- min_distance_included, max_delivery_radius (estratégia comercial)
  -- establishment_latitude, establishment_longitude (localização exata)
  -- peak_time_adjustment (lógica de negócio)
FROM establishment_settings;

-- Permitir SELECT público na VIEW (dados já filtrados)
GRANT SELECT ON establishment_public TO anon, authenticated;

-- =====================================================
-- FASE 4: RESTRINGIR DADOS FINANCEIROS DA COZINHA
-- =====================================================

-- 4.1 Remover acesso de leitura da cozinha ao caixa
DROP POLICY IF EXISTS "Kitchen can view cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "Kitchen can view cash_transactions" ON cash_transactions;

-- =====================================================
-- COMENTÁRIO: O que NÃO foi alterado (já está seguro)
-- =====================================================
-- profiles: RLS restringe a auth.uid() = id ✅
-- addresses: RLS restringe a auth.uid() = user_id ✅  
-- orders coordenadas para motoboy: Necessário para navegação ✅
-- order_items: Já tem RLS apropriado ✅