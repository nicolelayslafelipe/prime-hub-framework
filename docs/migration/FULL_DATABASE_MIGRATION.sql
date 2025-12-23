-- =====================================================
-- MIGRAÇÃO COMPLETA DO BANCO DE DADOS - DeliveryOS
-- Execute este arquivo no SQL Editor do Supabase Externo
-- =====================================================

-- =====================================================
-- PARTE 1: TIPOS E FUNÇÕES BASE
-- =====================================================

-- Criar ENUM para roles
CREATE TYPE public.app_role AS ENUM ('client', 'admin', 'kitchen', 'motoboy');

-- Função para verificar role (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'kitchen' THEN 2 
      WHEN 'motoboy' THEN 3 
      ELSE 4 
    END
  LIMIT 1
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- PARTE 2: TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Cliente',
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍔',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image TEXT DEFAULT '🍔',
  category_id TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  allow_pickup BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15,
  tag TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_latitude NUMERIC,
  customer_longitude NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  coupon_code TEXT,
  coupon_discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  notes TEXT,
  needs_change BOOLEAN DEFAULT false,
  change_for NUMERIC,
  change_amount NUMERIC,
  motoboy_id TEXT,
  order_type TEXT DEFAULT 'delivery',
  table_number TEXT,
  cash_register_id UUID,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_checkout_url TEXT,
  mp_qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  additions TEXT[],
  notes TEXT
);

-- Tabela de logs de status do pedido
CREATE TABLE public.order_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de endereços
CREATE TABLE public.addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Casa',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'SP',
  zip_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  reference TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de métodos de pagamento
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  max_change NUMERIC,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  external_id TEXT,
  qr_code TEXT,
  checkout_url TEXT,
  payer_email TEXT,
  payer_document TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de cupons
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  max_discount NUMERIC,
  min_order_value NUMERIC DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de zonas de entrega
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fee NUMERIC DEFAULT 0,
  min_order NUMERIC DEFAULT 0,
  estimated_time INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações do estabelecimento
CREATE TABLE public.establishment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'DeliveryOS',
  description TEXT,
  logo TEXT,
  banner TEXT,
  banner_text TEXT,
  phone TEXT DEFAULT '(11) 99999-9999',
  whatsapp TEXT DEFAULT '5511999999999',
  address TEXT DEFAULT 'Rua Exemplo, 123 - Centro',
  city TEXT DEFAULT 'São Paulo',
  state TEXT DEFAULT 'SP',
  neighborhood TEXT,
  zip_code TEXT,
  is_open BOOLEAN DEFAULT true,
  is_delivery_enabled BOOLEAN DEFAULT true,
  delivery_fee NUMERIC DEFAULT 5,
  min_order_value NUMERIC DEFAULT 20,
  estimated_delivery_time INTEGER DEFAULT 45,
  delivery_area TEXT,
  primary_color TEXT DEFAULT '#10b981',
  accent_color TEXT DEFAULT '#34d399',
  selected_theme TEXT DEFAULT 'premium-dark',
  show_banner BOOLEAN DEFAULT false,
  use_gradient BOOLEAN DEFAULT false,
  use_banner_as_login_bg BOOLEAN DEFAULT true,
  average_rating NUMERIC DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  average_prep_time INTEGER DEFAULT 15,
  peak_time_adjustment INTEGER DEFAULT 10,
  distance_fee_enabled BOOLEAN DEFAULT false,
  base_delivery_fee NUMERIC DEFAULT 5,
  price_per_km NUMERIC DEFAULT 2,
  min_distance_included NUMERIC DEFAULT 2,
  max_delivery_radius NUMERIC DEFAULT 10,
  establishment_latitude NUMERIC,
  establishment_longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de horários de funcionamento
-- (Gerenciada via admin_settings com key 'business_hours')

-- Tabela de notificações admin
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de logs de auditoria
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações admin
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de integrações API
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'disconnected',
  environment TEXT DEFAULT 'test',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de status de integrações
CREATE TABLE public.integration_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_key TEXT NOT NULL UNIQUE,
  integration_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_check TIMESTAMP WITH TIME ZONE,
  last_success TIMESTAMP WITH TIME ZONE,
  last_error TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de integrações
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de banners
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de templates de mensagens
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações de som
CREATE TABLE public.sound_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_type TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  volume NUMERIC DEFAULT 0.7,
  sound_type TEXT DEFAULT 'bell',
  min_interval_seconds INTEGER DEFAULT 3,
  repeat_enabled BOOLEAN DEFAULT false,
  repeat_interval_seconds INTEGER DEFAULT 30,
  max_repeat_duration_seconds INTEGER DEFAULT 300,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de preferências do cliente
CREATE TABLE public.client_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  push_notifications BOOLEAN DEFAULT true,
  promo_notifications BOOLEAN DEFAULT false,
  save_payment_method BOOLEAN DEFAULT true,
  last_payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de assinaturas push
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de caixa registradora
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  expected_amount NUMERIC,
  difference NUMERIC,
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de transações do caixa
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar FK de cash_register_id em orders
ALTER TABLE public.orders 
ADD CONSTRAINT orders_cash_register_id_fkey 
FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id);

-- Tabela de configurações de fidelidade
CREATE TABLE public.loyalty_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_active BOOLEAN DEFAULT false,
  points_per_real INTEGER DEFAULT 10,
  minimum_redemption INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de recompensas de fidelidade
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configurações de mapa
CREATE TABLE public.map_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapbox_token_encrypted TEXT,
  default_zoom INTEGER DEFAULT 15,
  default_style TEXT DEFAULT 'streets-v12',
  credentials_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- PARTE 3: HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 4: POLÍTICAS RLS
-- =====================================================

-- === USER_ROLES ===
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === PROFILES ===
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- === CATEGORIES ===
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- === PRODUCTS ===
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- === ORDERS ===
CREATE POLICY "Clients can create own orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid()::text);
CREATE POLICY "Clients can view own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid()::text);
CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));
CREATE POLICY "Only admins can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Motoboy can view ready and assigned orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'motoboy') AND (status = 'ready' OR motoboy_id = auth.uid()::text));
CREATE POLICY "Motoboy can update ready and assigned orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'motoboy') AND (status = 'ready' OR motoboy_id = auth.uid()::text));

-- === ORDER_ITEMS ===
CREATE POLICY "Clients can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()::text));
CREATE POLICY "Clients can insert own order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()::text));
CREATE POLICY "Staff can view all order items" ON public.order_items FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));
CREATE POLICY "Only admins can update order items" ON public.order_items FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete order items" ON public.order_items FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Motoboy can view ready and assigned order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND has_role(auth.uid(), 'motoboy') AND (orders.status = 'ready' OR orders.motoboy_id = auth.uid()::text)));

-- === ORDER_STATUS_LOGS ===
CREATE POLICY "Staff can view order logs" ON public.order_status_logs FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));
CREATE POLICY "Staff can insert order logs" ON public.order_status_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen') OR has_role(auth.uid(), 'motoboy'));
CREATE POLICY "Clients can view own order logs" ON public.order_status_logs FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_logs.order_id AND orders.customer_id = auth.uid()::text));
CREATE POLICY "Motoboy can view assigned order logs" ON public.order_status_logs FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_logs.order_id AND orders.motoboy_id = auth.uid()::text));

-- === ADDRESSES ===
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- === PAYMENT_METHODS ===
CREATE POLICY "Anyone can view payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admins can insert payment_methods" ON public.payment_methods FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment_methods" ON public.payment_methods FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payment_methods" ON public.payment_methods FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === PAYMENTS ===
CREATE POLICY "Clients can view own payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid()::text));
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert payments" ON public.payments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === COUPONS ===
CREATE POLICY "Anyone can view valid coupons" ON public.coupons FOR SELECT USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));
CREATE POLICY "Admins can view all coupons" ON public.coupons FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === DELIVERY_ZONES ===
CREATE POLICY "Anyone can view active delivery_zones" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Admins can insert delivery_zones" ON public.delivery_zones FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update delivery_zones" ON public.delivery_zones FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete delivery_zones" ON public.delivery_zones FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === ESTABLISHMENT_SETTINGS ===
CREATE POLICY "Only admins can view full establishment_settings" ON public.establishment_settings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert establishment settings" ON public.establishment_settings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update establishment settings" ON public.establishment_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- === ADMIN_NOTIFICATIONS ===
CREATE POLICY "Admins can view all notifications" ON public.admin_notifications FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete notifications" ON public.admin_notifications FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === ADMIN_AUDIT_LOGS ===
CREATE POLICY "Only admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow insert for authenticated users" ON public.admin_audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- === ADMIN_SETTINGS ===
CREATE POLICY "Only admins can view admin_settings" ON public.admin_settings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert admin_settings" ON public.admin_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update admin_settings" ON public.admin_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete admin_settings" ON public.admin_settings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === API_INTEGRATIONS ===
CREATE POLICY "Only admins can view api_integrations" ON public.api_integrations FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert api_integrations" ON public.api_integrations FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update api_integrations" ON public.api_integrations FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- === INTEGRATION_STATUS ===
CREATE POLICY "Only admins can view integration_status" ON public.integration_status FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage integration_status" ON public.integration_status FOR ALL USING (has_role(auth.uid(), 'admin'));

-- === INTEGRATION_LOGS ===
CREATE POLICY "Admins can view integration_logs" ON public.integration_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage integration_logs" ON public.integration_logs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- === BANNERS ===
CREATE POLICY "Anyone can view banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- === MESSAGE_TEMPLATES ===
CREATE POLICY "Anyone can view message_templates" ON public.message_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert message_templates" ON public.message_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update message_templates" ON public.message_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete message_templates" ON public.message_templates FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === SOUND_SETTINGS ===
CREATE POLICY "Allow public read access to sound_settings" ON public.sound_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert sound_settings" ON public.sound_settings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update sound_settings" ON public.sound_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- === CLIENT_PREFERENCES ===
CREATE POLICY "Users can view their own preferences" ON public.client_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.client_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.client_preferences FOR UPDATE USING (auth.uid() = user_id);

-- === PUSH_SUBSCRIPTIONS ===
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all push subscriptions" ON public.push_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- === CASH_REGISTERS ===
CREATE POLICY "Admins can manage cash_registers" ON public.cash_registers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- === CASH_TRANSACTIONS ===
CREATE POLICY "Admins can manage cash_transactions" ON public.cash_transactions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- === LOYALTY_SETTINGS ===
CREATE POLICY "Anyone can view loyalty_settings" ON public.loyalty_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert loyalty_settings" ON public.loyalty_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update loyalty_settings" ON public.loyalty_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- === LOYALTY_REWARDS ===
CREATE POLICY "Anyone can view loyalty_rewards" ON public.loyalty_rewards FOR SELECT USING (true);
CREATE POLICY "Admins can insert loyalty_rewards" ON public.loyalty_rewards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update loyalty_rewards" ON public.loyalty_rewards FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete loyalty_rewards" ON public.loyalty_rewards FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- === MAP_SETTINGS ===
CREATE POLICY "Only admins can manage map_settings" ON public.map_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- PARTE 5: TRIGGERS
-- =====================================================

-- Trigger para criar perfil quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Cliente'),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Assign default client role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para notificar novo pedido
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
  VALUES (
    'new_order',
    'Novo Pedido Recebido!',
    'Pedido #' || NEW.order_number || ' de ' || NEW.customer_name,
    NEW.id,
    NEW.order_number
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

-- Trigger para notificar atualização de pedido
CREATE OR REPLACE FUNCTION public.notify_order_update()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    notification_type := 'order_paid';
    notification_title := 'Pagamento Confirmado!';
    notification_message := 'Pedido #' || NEW.order_number || ' pago via ' || COALESCE(NEW.payment_method, 'PIX');
    
    INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
    VALUES (notification_type, notification_title, notification_message, NEW.id, NEW.order_number);
    
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    notification_type := 'order_cancelled';
    notification_title := 'Pedido Cancelado';
    notification_message := 'Pedido #' || NEW.order_number || ' foi cancelado';
    
    INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
    VALUES (notification_type, notification_title, notification_message, NEW.id, NEW.order_number);
    
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'cancelled' THEN
    notification_type := 'order_updated';
    notification_title := 'Status Atualizado';
    notification_message := 'Pedido #' || NEW.order_number || ' movido para ' || NEW.status;
    
    INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
    VALUES (notification_type, notification_title, notification_message, NEW.id, NEW.order_number);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_update();

-- Trigger para log de mudança de status
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_logs (order_id, status, changed_by, notes)
    VALUES (NEW.id, NEW.status, auth.uid(), NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Triggers de updated_at para todas as tabelas
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_establishment_updated_at BEFORE UPDATE ON public.establishment_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_notifications_updated_at BEFORE UPDATE ON public.admin_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON public.api_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_status_updated_at BEFORE UPDATE ON public.integration_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sound_settings_updated_at BEFORE UPDATE ON public.sound_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_preferences_updated_at BEFORE UPDATE ON public.client_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON public.cash_registers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_settings_updated_at BEFORE UPDATE ON public.loyalty_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_map_settings_updated_at BEFORE UPDATE ON public.map_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 6: FUNÇÕES DE AUDITORIA
-- =====================================================

CREATE OR REPLACE FUNCTION public.audit_coupons_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'coupons',
    jsonb_build_object('coupon_id', COALESCE(NEW.id, OLD.id), 'coupon_code', COALESCE(NEW.code, OLD.code), 'action', TG_OP)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_coupons AFTER INSERT OR UPDATE OR DELETE ON public.coupons FOR EACH ROW EXECUTE FUNCTION audit_coupons_trigger();

CREATE OR REPLACE FUNCTION public.audit_payment_methods_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'payment_methods',
    jsonb_build_object('payment_method_id', COALESCE(NEW.id, OLD.id), 'payment_method_name', COALESCE(NEW.name, OLD.name), 'action', TG_OP)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_payment_methods AFTER INSERT OR UPDATE OR DELETE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION audit_payment_methods_trigger();

CREATE OR REPLACE FUNCTION public.audit_establishment_settings_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'establishment_settings',
    jsonb_build_object('setting_id', COALESCE(NEW.id, OLD.id), 'action', TG_OP, 'is_open_changed', CASE WHEN TG_OP = 'UPDATE' THEN OLD.is_open IS DISTINCT FROM NEW.is_open ELSE false END)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_establishment_settings AFTER INSERT OR UPDATE OR DELETE ON public.establishment_settings FOR EACH ROW EXECUTE FUNCTION audit_establishment_settings_trigger();

CREATE OR REPLACE FUNCTION public.audit_cash_register_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'cash_registers',
    jsonb_build_object('cash_register_id', COALESCE(NEW.id, OLD.id), 'status', COALESCE(NEW.status, OLD.status), 'action', TG_OP, 'opening_amount', CASE WHEN TG_OP = 'INSERT' THEN NEW.opening_amount ELSE NULL END, 'closing_amount', CASE WHEN TG_OP = 'UPDATE' AND NEW.status = 'closed' THEN NEW.closing_amount ELSE NULL END)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_cash_registers AFTER INSERT OR UPDATE OR DELETE ON public.cash_registers FOR EACH ROW EXECUTE FUNCTION audit_cash_register_trigger();

CREATE OR REPLACE FUNCTION public.audit_cash_transaction_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'cash_transactions',
    jsonb_build_object('transaction_id', COALESCE(NEW.id, OLD.id), 'type', COALESCE(NEW.type, OLD.type), 'amount', COALESCE(NEW.amount, OLD.amount), 'payment_method', COALESCE(NEW.payment_method, OLD.payment_method), 'action', TG_OP)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_cash_transactions AFTER INSERT OR UPDATE OR DELETE ON public.cash_transactions FOR EACH ROW EXECUTE FUNCTION audit_cash_transaction_trigger();

-- =====================================================
-- PARTE 7: FUNÇÃO PÚBLICA PARA INFO DO ESTABELECIMENTO
-- =====================================================

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
    id, name, description, logo, banner, banner_text,
    is_open, is_delivery_enabled, estimated_delivery_time,
    min_order_value, delivery_fee, primary_color, accent_color,
    selected_theme, show_banner, use_gradient, use_banner_as_login_bg,
    city, state, neighborhood, average_rating, total_reviews, average_prep_time
  FROM establishment_settings
  LIMIT 1;
$$;

-- =====================================================
-- PARTE 8: ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_motoboy_id ON public.orders(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_sort ON public.products(sort_order);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order ON public.order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.admin_audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- =====================================================
-- PARTE 9: REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishment_settings;

-- =====================================================
-- PARTE 10: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage - Avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de Storage - Products
CREATE POLICY "Product images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Políticas de Storage - Branding
CREATE POLICY "Branding images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
CREATE POLICY "Admins can upload branding images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can update branding images" ON storage.objects FOR UPDATE USING (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Admins can delete branding images" ON storage.objects FOR DELETE USING (bucket_id = 'branding' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- =====================================================
-- PARTE 11: DADOS INICIAIS
-- =====================================================

-- Configurações do estabelecimento
INSERT INTO public.establishment_settings (name, description, is_open) 
VALUES ('DeliveryOS', 'Sistema de Delivery', true)
ON CONFLICT DO NOTHING;

-- Configurações de fidelidade
INSERT INTO public.loyalty_settings (is_active, points_per_real, minimum_redemption)
VALUES (false, 10, 100)
ON CONFLICT DO NOTHING;

-- Configurações de som
INSERT INTO public.sound_settings (panel_type, enabled, volume, sound_type) VALUES
('admin', true, 0.7, 'bell'),
('kitchen', true, 0.8, 'notification'),
('motoboy', true, 0.7, 'bell')
ON CONFLICT (panel_type) DO NOTHING;

-- Métodos de pagamento
INSERT INTO public.payment_methods (name, type, icon, is_active, sort_order) VALUES
('Dinheiro', 'cash', '💵', true, 1),
('PIX', 'pix', '📱', true, 2),
('Cartão de Crédito', 'credit', '💳', true, 3),
('Cartão de Débito', 'debit', '💳', true, 4),
('Vale Refeição', 'voucher', '🎫', true, 5)
ON CONFLICT DO NOTHING;

-- Categorias
INSERT INTO public.categories (name, icon, sort_order, is_active) VALUES
('Lanches', '🍔', 1, true),
('Pizzas', '🍕', 2, true),
('Bebidas', '🥤', 3, true),
('Sobremesas', '🍰', 4, true),
('Combos', '🍱', 5, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
