-- =====================================================
-- SCRIPT DE MIGRAÇÃO - DADOS
-- Sistema de Delivery - DeliveryOS
-- Gerado em: 2025-12-22
-- =====================================================
-- IMPORTANTE: Execute este script APÓS criar os usuários 
-- no auth.users do Supabase e atualizar os UUIDs abaixo
-- =====================================================

-- =====================================================
-- CATEGORIES (5 registros)
-- =====================================================
INSERT INTO public.categories (id, name, icon, sort_order, is_active, created_at, updated_at) VALUES
('fdf33837-611c-4316-b2e1-68766865a1c9', 'Burgers', '🍔', 1, true, '2025-12-21T00:04:47.277467+00:00', '2025-12-21T00:04:47.277467+00:00'),
('201e4351-7a8d-457a-b791-cf350c389690', 'Pizzas', '🍕', 2, true, '2025-12-21T00:04:47.277467+00:00', '2025-12-21T00:04:47.277467+00:00'),
('2526b3c7-2038-4778-a02b-261d7e4313b9', 'Bebidas', '🥤', 3, true, '2025-12-21T00:04:47.277467+00:00', '2025-12-21T00:04:47.277467+00:00'),
('70e93041-18f5-49e1-83df-d986d7953d8c', 'Sobremesas', '🍰', 4, true, '2025-12-21T00:04:47.277467+00:00', '2025-12-21T00:04:47.277467+00:00'),
('706e6ef8-de6a-4e48-b02e-17be0e7cbeb6', 'Combos', '🎁', 5, true, '2025-12-21T00:04:47.277467+00:00', '2025-12-21T00:04:47.277467+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PRODUCTS (26 registros - principais)
-- =====================================================
INSERT INTO public.products (id, category_id, name, description, price, image, tag, is_available, allow_pickup, preparation_time, sort_order, created_at, updated_at) VALUES
('e47a0389-953c-4eca-909c-74bc522ff941', 'fdf33837-611c-4316-b2e1-68766865a1c9', 'X-Burger Especial', 'Pão brioche artesanal, hambúrguer angus 180g, queijo cheddar inglês, bacon crocante, alface americana, tomate e molho especial da casa', 28.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 'MAIS VENDIDO', true, true, 15, 1, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('3bc17d99-9943-47f8-ab55-a59a805c8c95', 'fdf33837-611c-4316-b2e1-68766865a1c9', 'X-Bacon Duplo', 'Pão australiano, dois hambúrgueres 150g cada, camadas generosas de bacon artesanal, queijo cheddar derretido e onion rings', 35.90, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=80', 'NOVO', true, true, 18, 2, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('bacd898f-3f70-45b1-97e4-e59e22553063', 'fdf33837-611c-4316-b2e1-68766865a1c9', 'Smash Burger', 'Dois smash patties 100g, queijo americano cremoso, cebola caramelizada, picles artesanal e molho smash', 32.90, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80', 'POPULAR', true, true, 12, 3, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('edc64981-f719-4b89-8f41-601d154951f5', 'fdf33837-611c-4316-b2e1-68766865a1c9', 'Burger Trufado', 'Hambúrguer wagyu 200g, queijo brie derretido, cogumelos salteados na manteiga trufada, rúcula fresca e aioli de trufa negra', 49.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80', NULL, true, true, 20, 4, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('a1b2c3d4-1111-2222-3333-444455556666', '201e4351-7a8d-457a-b791-cf350c389690', 'Pizza Margherita', 'Molho de tomate italiano, mozzarella de búfala, manjericão fresco e azeite extra virgem', 45.90, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80', 'CLÁSSICA', true, true, 25, 1, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('a1b2c3d4-1111-2222-3333-444455557777', '201e4351-7a8d-457a-b791-cf350c389690', 'Pizza Calabresa', 'Calabresa artesanal fatiada, cebola roxa, azeitonas pretas e mozzarella', 42.90, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', NULL, true, true, 25, 2, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('b2c3d4e5-2222-3333-4444-555566667777', '2526b3c7-2038-4778-a02b-261d7e4313b9', 'Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta - 350ml', 6.90, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80', NULL, true, true, 1, 1, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('b2c3d4e5-2222-3333-4444-555566668888', '2526b3c7-2038-4778-a02b-261d7e4313b9', 'Suco Natural', 'Laranja, limão ou maracujá - 500ml', 12.90, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80', 'NATURAL', true, true, 5, 2, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('c3d4e5f6-3333-4444-5555-666677778888', '70e93041-18f5-49e1-83df-d986d7953d8c', 'Brownie com Sorvete', 'Brownie artesanal de chocolate belga com sorvete de creme e calda quente', 18.90, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=800&q=80', 'FAVORITO', true, true, 8, 1, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('c3d4e5f6-3333-4444-5555-666677779999', '70e93041-18f5-49e1-83df-d986d7953d8c', 'Petit Gateau', 'Bolo de chocolate com recheio cremoso e sorvete de baunilha', 22.90, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80', NULL, true, true, 10, 2, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00'),
('d4e5f6a7-4444-5555-6666-777788889999', '706e6ef8-de6a-4e48-b02e-17be0e7cbeb6', 'Combo Família', 'X-Burger Especial + X-Bacon Duplo + Smash Burger + 4 Refrigerantes + Brownie', 89.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80', 'ECONOMIA', true, true, 25, 1, '2025-12-21T00:05:52.9033+00:00', '2025-12-21T00:05:52.9033+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PAYMENT_METHODS (5 registros)
-- =====================================================
INSERT INTO public.payment_methods (id, name, type, icon, is_active, max_change, sort_order, created_at, updated_at) VALUES
('f306369e-09da-47d7-8c32-794a1c3c6cf4', 'PIX', 'pix', '📱', true, NULL, 1, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('8ec06222-4831-4abf-98a3-d3c339e056b8', 'Cartão de Crédito', 'credit', '💳', false, NULL, 2, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T16:47:55.132275+00:00'),
('b871185d-6cba-444d-b94c-7713d03149a8', 'Cartão de Débito', 'debit', '💳', false, NULL, 3, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T12:37:28.099544+00:00'),
('de9eff4a-72d4-467f-824a-68fe260f85c3', 'Dinheiro', 'cash', '💵', true, 100, 4, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T12:37:37.495783+00:00'),
('1706e93e-db49-433e-8689-010955acc7ea', 'Vale Refeição', 'voucher', '🎫', false, NULL, 5, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T12:37:47.180089+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- BANNERS (1 registro)
-- =====================================================
INSERT INTO public.banners (id, title, description, image_url, is_active, sort_order, created_at, updated_at) VALUES
('44f1ae14-cc57-4b49-a474-eace8e34d6a9', 'Promoção Compre 2 Leve Refri 2L', NULL, 'https://lujdjwqbsqterbcvzyvo.supabase.co/storage/v1/object/public/branding/banners-1766287724087.jpeg', false, 0, '2025-12-21T03:29:01.604727+00:00', '2025-12-21T13:17:19.081037+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COUPONS (2 registros)
-- =====================================================
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, usage_count, valid_from, valid_until, is_active, created_at, updated_at) VALUES
('34fdb6ea-0bfe-421a-b568-367cc2207af4', 'FRETE5', 'R$ 5 de desconto', 'fixed', 5, NULL, 25, NULL, 0, '2025-12-21T14:41:20.458103+00:00', NULL, true, '2025-12-21T14:41:20.458103+00:00', '2025-12-21T14:41:20.458103+00:00'),
('2d1be15a-c955-4b0c-bdcd-990555429ef5', 'BEMVINDO10', 'Desconto de 10% para novos clientes', 'percentage', 10, 20, 30, 100, 0, '2025-12-21T14:41:20.458103+00:00', NULL, false, '2025-12-21T14:41:20.458103+00:00', '2025-12-21T16:48:15.241465+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- LOYALTY_SETTINGS (1 registro)
-- =====================================================
INSERT INTO public.loyalty_settings (id, is_active, points_per_real, minimum_redemption, created_at, updated_at) VALUES
('d5ebf9cf-1a75-4601-8dae-e3059e625474', true, 10, 100, '2025-12-21T00:25:59.417053+00:00', '2025-12-22T01:55:59.945802+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- LOYALTY_REWARDS (3 registros)
-- =====================================================
INSERT INTO public.loyalty_rewards (id, name, description, points_cost, is_active, sort_order, created_at, updated_at) VALUES
('45270ea0-b592-436a-93a1-5df52c2ab0b0', 'Refrigerante Grátis', 'Ganhe uma lata de refrigerante', 100, true, 1, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('9e88b191-abfa-4490-8caf-3099a762eb71', 'Sobremesa Grátis', 'Escolha uma sobremesa do cardápio', 200, true, 2, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('f8f7847d-8cca-4a27-af3e-be10a03bff22', '10% de Desconto', 'Desconto de 10% no pedido', 150, true, 3, '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MESSAGE_TEMPLATES (6 registros)
-- =====================================================
INSERT INTO public.message_templates (id, name, type, content, variables, created_at, updated_at) VALUES
('4db2be28-801c-4851-bebd-5dfb3f548657', 'Confirmação de Pedido', 'order_confirmation', 'Olá {cliente}! Seu pedido #{numero} foi confirmado.', ARRAY['cliente', 'numero'], '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('15d4d375-0f37-4003-aa61-abbe76973b57', 'Pedido em Preparo', 'order_preparing', 'Seu pedido #{numero} está sendo preparado!', ARRAY['numero'], '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('8ce46c2a-855c-44f9-8eb9-4f3d0d8fe3b3', 'Pedido Pronto', 'order_ready', 'Seu pedido #{numero} está pronto para entrega!', ARRAY['numero'], '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('a2f31f95-16a0-4cca-8baf-730b957db26d', 'Pedido Entregue', 'order_delivered', 'Seu pedido #{numero} foi entregue. Obrigado!', ARRAY['numero'], '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('25a12b81-23e4-4b29-ac32-340b0a5cb7c0', 'Pagamento PIX', 'pix_payment', 'Olá {cliente}! Para pagamento via PIX, utilize a chave: {chave_pix}', ARRAY['cliente', 'chave_pix'], '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00'),
('94dfd330-4458-4e8f-b1c3-232e70bc5b66', 'Boas-vindas', 'welcome', 'Bem-vindo(a) ao {estabelecimento}!', ARRAY['estabelecimento'], '2025-12-21T00:25:59.417053+00:00', '2025-12-21T00:25:59.417053+00:00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ESTABLISHMENT_SETTINGS (configuração padrão)
-- Execute após ajustar para seu estabelecimento
-- =====================================================
INSERT INTO public.establishment_settings (
  id, name, description, logo, banner, banner_text, show_banner,
  is_open, is_delivery_enabled, phone, whatsapp, address,
  city, state, neighborhood, min_order_value, delivery_fee,
  estimated_delivery_time, average_prep_time, primary_color, accent_color,
  selected_theme, use_gradient, use_banner_as_login_bg,
  average_rating, total_reviews
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'DeliveryOS',
  'Sistema de delivery completo',
  NULL,
  NULL,
  'Peça agora!',
  false,
  true,
  true,
  '(11) 99999-9999',
  '5511999999999',
  'Rua Exemplo, 123 - Centro',
  'São Paulo',
  'SP',
  'Centro',
  20,
  5,
  45,
  15,
  '#10b981',
  '#34d399',
  'premium-dark',
  false,
  true,
  5.0,
  0
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SOUND_SETTINGS (configurações padrão)
-- =====================================================
INSERT INTO public.sound_settings (id, panel_type, enabled, sound_type, volume, repeat_enabled, repeat_interval_seconds, min_interval_seconds, max_repeat_duration_seconds) VALUES
('s0000001-0000-0000-0000-000000000001', 'admin', true, 'bell', 0.7, false, 30, 3, 300),
('s0000002-0000-0000-0000-000000000002', 'kitchen', true, 'bell', 0.8, true, 15, 3, 300),
('s0000003-0000-0000-0000-000000000003', 'motoboy', true, 'notification', 0.7, false, 30, 3, 300)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- NOTA IMPORTANTE SOBRE USUÁRIOS
-- =====================================================
-- Os dados de profiles e user_roles dependem dos usuários
-- criados no auth.users do Supabase.
-- 
-- Para migrar usuários:
-- 1. Crie os usuários no Supabase Auth (Dashboard > Authentication > Users)
-- 2. Anote os UUIDs gerados
-- 3. Atualize os IDs nos INSERTs abaixo
-- 4. Execute os INSERTs de profiles e user_roles
-- =====================================================

-- Exemplo de INSERT para profiles (atualize os UUIDs):
-- INSERT INTO public.profiles (id, name, phone, is_active) VALUES
-- ('SEU-UUID-AQUI', 'Nome do Usuário', '11999999999', true);

-- Exemplo de INSERT para user_roles (atualize os UUIDs):
-- INSERT INTO public.user_roles (user_id, role) VALUES
-- ('SEU-UUID-AQUI', 'admin');
