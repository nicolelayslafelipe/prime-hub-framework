-- =====================================================
-- SCRIPT DE MIGRAÇÃO - ESTRUTURA DO BANCO DE DADOS
-- Sistema de Delivery - DeliveryOS
-- Gerado em: 2025-12-22
-- =====================================================

-- 1. CRIAR ENUM DE ROLES
-- =====================================================
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'kitchen', 'motoboy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. FUNÇÃO AUXILIAR: has_role (Security Definer)
-- =====================================================
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

-- 3. FUNÇÃO AUXILIAR: get_user_role
-- =====================================================
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

-- 4. FUNÇÃO: update_updated_at_column
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. FUNÇÃO: handle_new_user (trigger para novos usuários)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- 6. TABELA: user_roles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'client'::app_role,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. TABELA: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY,
    name text NOT NULL DEFAULT 'Cliente'::text,
    phone text,
    address text,
    avatar_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. TABELA: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon text DEFAULT '🍔'::text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 9. TABELA: products
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    image text DEFAULT '🍔'::text,
    tag text,
    is_available boolean DEFAULT true,
    allow_pickup boolean DEFAULT true,
    preparation_time integer DEFAULT 15,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 10. TABELA: addresses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    label text NOT NULL DEFAULT 'Casa'::text,
    street text NOT NULL,
    number text NOT NULL,
    complement text,
    neighborhood text NOT NULL,
    city text NOT NULL,
    state text NOT NULL DEFAULT 'SP'::text,
    zip_code text,
    reference text,
    latitude numeric,
    longitude numeric,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 11. TABELA: orders
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq;

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number integer NOT NULL DEFAULT nextval('orders_order_number_seq'::regclass),
    customer_id text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_address text NOT NULL,
    customer_latitude numeric,
    customer_longitude numeric,
    status text NOT NULL DEFAULT 'pending'::text,
    order_type text DEFAULT 'delivery'::text,
    table_number text,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'pending'::text,
    subtotal numeric NOT NULL,
    delivery_fee numeric DEFAULT 0,
    coupon_code text,
    coupon_discount numeric DEFAULT 0,
    total numeric NOT NULL,
    notes text,
    needs_change boolean DEFAULT false,
    change_for numeric,
    change_amount numeric,
    motoboy_id text,
    cash_register_id uuid,
    mp_payment_id text,
    mp_preference_id text,
    mp_checkout_url text,
    mp_qr_code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 12. TABELA: order_items
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid,
    product_id text NOT NULL,
    product_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL,
    additions text[],
    notes text
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 13. TABELA: order_status_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    status text NOT NULL,
    changed_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

-- 14. TABELA: payments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    provider text NOT NULL DEFAULT 'mercadopago'::text,
    external_id text,
    status text NOT NULL DEFAULT 'pending'::text,
    amount numeric NOT NULL,
    checkout_url text,
    qr_code text,
    payer_email text,
    payer_document text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 15. TABELA: payment_methods
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    icon text,
    is_active boolean DEFAULT true,
    max_change numeric,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 16. TABELA: establishment_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.establishment_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL DEFAULT 'DeliveryOS'::text,
    description text,
    logo text,
    banner text,
    banner_text text,
    show_banner boolean DEFAULT false,
    is_open boolean DEFAULT true,
    is_delivery_enabled boolean DEFAULT true,
    phone text DEFAULT '(11) 99999-9999'::text,
    whatsapp text DEFAULT '5511999999999'::text,
    address text DEFAULT 'Rua Exemplo, 123 - Centro'::text,
    city text DEFAULT 'São Paulo'::text,
    state text DEFAULT 'SP'::text,
    zip_code text,
    neighborhood text,
    delivery_area text,
    min_order_value numeric DEFAULT 20,
    delivery_fee numeric DEFAULT 5,
    estimated_delivery_time integer DEFAULT 45,
    average_prep_time integer DEFAULT 15,
    primary_color text DEFAULT '#10b981'::text,
    accent_color text DEFAULT '#34d399'::text,
    selected_theme text DEFAULT 'premium-dark'::text,
    use_gradient boolean DEFAULT false,
    use_banner_as_login_bg boolean DEFAULT true,
    average_rating numeric DEFAULT 5.0,
    total_reviews integer DEFAULT 0,
    peak_time_adjustment integer DEFAULT 10,
    distance_fee_enabled boolean DEFAULT false,
    base_delivery_fee numeric DEFAULT 5,
    price_per_km numeric DEFAULT 2,
    min_distance_included numeric DEFAULT 2,
    max_delivery_radius numeric DEFAULT 10,
    establishment_latitude numeric,
    establishment_longitude numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;

-- 17. TABELA: delivery_zones
-- =====================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    fee numeric DEFAULT 0,
    min_order numeric DEFAULT 0,
    estimated_time integer DEFAULT 0,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- 18. TABELA: banners
-- =====================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 19. TABELA: coupons
-- =====================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value numeric NOT NULL,
    max_discount numeric,
    min_order_value numeric DEFAULT 0,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 20. TABELA: loyalty_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active boolean DEFAULT false,
    points_per_real integer DEFAULT 10,
    minimum_redemption integer DEFAULT 100,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

-- 21. TABELA: loyalty_rewards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- 22. TABELA: message_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    variables text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- 23. TABELA: admin_notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    order_id uuid,
    order_number integer,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- 24. TABELA: admin_audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 25. TABELA: admin_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 26. TABELA: sound_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sound_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_type text NOT NULL,
    enabled boolean DEFAULT true,
    sound_type text DEFAULT 'bell'::text,
    volume numeric DEFAULT 0.7,
    repeat_enabled boolean DEFAULT false,
    repeat_interval_seconds integer DEFAULT 30,
    min_interval_seconds integer DEFAULT 3,
    max_repeat_duration_seconds integer DEFAULT 300,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.sound_settings ENABLE ROW LEVEL SECURITY;

-- 27. TABELA: client_preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS public.client_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    push_notifications boolean DEFAULT true,
    promo_notifications boolean DEFAULT false,
    save_payment_method boolean DEFAULT true,
    last_payment_method text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;

-- 28. TABELA: push_subscriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 29. TABELA: map_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.map_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mapbox_token_encrypted text,
    default_style text DEFAULT 'streets-v12'::text,
    default_zoom integer DEFAULT 15,
    credentials_version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

-- 30. TABELA: api_integrations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.api_integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL,
    is_active boolean DEFAULT false,
    status text DEFAULT 'disconnected'::text,
    environment text DEFAULT 'test'::text,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- 31. TABELA: integration_status
-- =====================================================
CREATE TABLE IF NOT EXISTS public.integration_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_key text NOT NULL,
    integration_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    status text NOT NULL DEFAULT 'unknown'::text,
    last_check timestamp with time zone,
    last_success timestamp with time zone,
    last_error timestamp with time zone,
    error_count integer NOT NULL DEFAULT 0,
    error_message text,
    latency_ms integer,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;

-- 32. TABELA: integration_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_key text NOT NULL,
    event_type text NOT NULL,
    status text NOT NULL,
    message text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- 33. TABELA: cash_registers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'open'::text,
    opening_amount numeric NOT NULL DEFAULT 0,
    closing_amount numeric,
    expected_amount numeric,
    difference numeric,
    notes text,
    opened_at timestamp with time zone NOT NULL DEFAULT now(),
    closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- 34. TABELA: cash_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id uuid NOT NULL,
    order_id uuid,
    type text NOT NULL,
    payment_method text NOT NULL,
    amount numeric NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÕES DE NOTIFICAÇÃO
-- =====================================================

-- 35. FUNÇÃO: notify_new_order
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 36. FUNÇÃO: notify_order_update
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Pagamento confirmado
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    notification_type := 'order_paid';
    notification_title := 'Pagamento Confirmado!';
    notification_message := 'Pedido #' || NEW.order_number || ' pago via ' || COALESCE(NEW.payment_method, 'PIX');
    
    INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
    VALUES (notification_type, notification_title, notification_message, NEW.id, NEW.order_number);
    
  -- Pedido cancelado
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    notification_type := 'order_cancelled';
    notification_title := 'Pedido Cancelado';
    notification_message := 'Pedido #' || NEW.order_number || ' foi cancelado';
    
    INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
    VALUES (notification_type, notification_title, notification_message, NEW.id, NEW.order_number);
    
  -- Status alterado (exceto cancelled que já foi tratado)
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'cancelled' THEN
    notification_type := 'order_updated';
    notification_title := 'Status Atualizado';
    notification_message := 'Pedido #' || NEW.order_number || ' movido para ' || NEW.status;
    
    INSERT INTO public.admin_notifications (type, title, message, order_id, order_number)
    VALUES (notification_type, notification_title, notification_message, NEW.id, NEW.order_number);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 37. FUNÇÃO: log_order_status_change
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_logs (order_id, status, changed_by, notes)
    VALUES (NEW.id, NEW.status, auth.uid(), NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- 38. FUNÇÃO: get_public_establishment_info (View pública)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_public_establishment_info()
RETURNS TABLE(
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

-- =====================================================
-- FUNÇÕES DE AUDIT
-- =====================================================

-- 39. FUNÇÃO: audit_coupons_trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_coupons_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'coupons',
    jsonb_build_object(
      'coupon_id', COALESCE(NEW.id, OLD.id),
      'coupon_code', COALESCE(NEW.code, OLD.code),
      'action', TG_OP
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 40. FUNÇÃO: audit_payment_methods_trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_payment_methods_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'payment_methods',
    jsonb_build_object(
      'payment_method_id', COALESCE(NEW.id, OLD.id),
      'payment_method_name', COALESCE(NEW.name, OLD.name),
      'action', TG_OP
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 41. FUNÇÃO: audit_establishment_settings_trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_establishment_settings_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'establishment_settings',
    jsonb_build_object(
      'setting_id', COALESCE(NEW.id, OLD.id),
      'action', TG_OP,
      'is_open_changed', CASE WHEN TG_OP = 'UPDATE' THEN OLD.is_open IS DISTINCT FROM NEW.is_open ELSE false END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 42. FUNÇÃO: audit_cash_register_trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_cash_register_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'cash_registers',
    jsonb_build_object(
      'cash_register_id', COALESCE(NEW.id, OLD.id),
      'status', COALESCE(NEW.status, OLD.status),
      'action', TG_OP,
      'opening_amount', CASE WHEN TG_OP = 'INSERT' THEN NEW.opening_amount ELSE NULL END,
      'closing_amount', CASE WHEN TG_OP = 'UPDATE' AND NEW.status = 'closed' THEN NEW.closing_amount ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 43. FUNÇÃO: audit_cash_transaction_trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.audit_cash_transaction_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_logs (user_id, action, resource, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    'cash_transactions',
    jsonb_build_object(
      'transaction_id', COALESCE(NEW.id, OLD.id),
      'type', COALESCE(NEW.type, OLD.type),
      'amount', COALESCE(NEW.amount, OLD.amount),
      'payment_method', COALESCE(NEW.payment_method, OLD.payment_method),
      'action', TG_OP
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
