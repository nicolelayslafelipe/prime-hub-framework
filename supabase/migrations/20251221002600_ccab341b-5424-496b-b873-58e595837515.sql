-- Create admin_settings table for general settings (JSONB format)
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  icon text,
  is_active boolean DEFAULT true,
  max_change numeric,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loyalty_settings table
CREATE TABLE public.loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT false,
  points_per_real int DEFAULT 10,
  minimum_redemption int DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loyalty_rewards table
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost int NOT NULL,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create message_templates table
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create api_integrations table
CREATE TABLE public.api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text UNIQUE NOT NULL,
  is_active boolean DEFAULT false,
  environment text DEFAULT 'test',
  status text DEFAULT 'disconnected',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_settings
CREATE POLICY "Anyone can view admin_settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert admin_settings" ON public.admin_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update admin_settings" ON public.admin_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete admin_settings" ON public.admin_settings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_methods
CREATE POLICY "Anyone can view payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admins can insert payment_methods" ON public.payment_methods FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment_methods" ON public.payment_methods FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payment_methods" ON public.payment_methods FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_settings
CREATE POLICY "Anyone can view loyalty_settings" ON public.loyalty_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert loyalty_settings" ON public.loyalty_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update loyalty_settings" ON public.loyalty_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for loyalty_rewards
CREATE POLICY "Anyone can view loyalty_rewards" ON public.loyalty_rewards FOR SELECT USING (true);
CREATE POLICY "Admins can insert loyalty_rewards" ON public.loyalty_rewards FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update loyalty_rewards" ON public.loyalty_rewards FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete loyalty_rewards" ON public.loyalty_rewards FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for message_templates
CREATE POLICY "Anyone can view message_templates" ON public.message_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert message_templates" ON public.message_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update message_templates" ON public.message_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete message_templates" ON public.message_templates FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for api_integrations
CREATE POLICY "Anyone can view api_integrations" ON public.api_integrations FOR SELECT USING (true);
CREATE POLICY "Admins can insert api_integrations" ON public.api_integrations FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update api_integrations" ON public.api_integrations FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, icon, is_active, sort_order) VALUES
('PIX', 'pix', '📱', true, 1),
('Cartão de Crédito', 'credit', '💳', true, 2),
('Cartão de Débito', 'debit', '💳', true, 3),
('Dinheiro', 'cash', '💵', true, 4),
('Vale Refeição', 'voucher', '🎫', true, 5);

-- Insert default loyalty settings
INSERT INTO public.loyalty_settings (is_active, points_per_real, minimum_redemption) VALUES (false, 10, 100);

-- Insert default loyalty rewards
INSERT INTO public.loyalty_rewards (name, description, points_cost, is_active, sort_order) VALUES
('Refrigerante Grátis', 'Ganhe uma lata de refrigerante', 100, true, 1),
('Sobremesa Grátis', 'Escolha uma sobremesa do cardápio', 200, true, 2),
('10% de Desconto', 'Desconto de 10% no pedido', 150, true, 3);

-- Insert default message templates
INSERT INTO public.message_templates (type, name, content, variables) VALUES
('order_confirmation', 'Confirmação de Pedido', 'Olá {cliente}! Seu pedido #{numero} foi confirmado.', ARRAY['cliente', 'numero']),
('order_preparing', 'Pedido em Preparo', 'Seu pedido #{numero} está sendo preparado!', ARRAY['numero']),
('order_ready', 'Pedido Pronto', 'Seu pedido #{numero} está pronto para entrega!', ARRAY['numero']),
('order_delivered', 'Pedido Entregue', 'Seu pedido #{numero} foi entregue. Obrigado!', ARRAY['numero']),
('pix_payment', 'Pagamento PIX', 'Olá {cliente}! Para pagamento via PIX, utilize a chave: {chave_pix}', ARRAY['cliente', 'chave_pix']),
('welcome', 'Boas-vindas', 'Bem-vindo(a) ao {estabelecimento}!', ARRAY['estabelecimento']);

-- Insert default API integrations
INSERT INTO public.api_integrations (name, type, is_active, environment, status) VALUES
('Mercado Pago', 'mercado_pago', false, 'test', 'disconnected'),
('WhatsApp Business', 'whatsapp', false, 'production', 'disconnected'),
('Google Maps', 'google_maps', false, 'production', 'disconnected');

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value) VALUES
('operating_hours', '{"monday":{"open":"08:00","close":"22:00","isOpen":true},"tuesday":{"open":"08:00","close":"22:00","isOpen":true},"wednesday":{"open":"08:00","close":"22:00","isOpen":true},"thursday":{"open":"08:00","close":"22:00","isOpen":true},"friday":{"open":"08:00","close":"22:00","isOpen":true},"saturday":{"open":"09:00","close":"23:00","isOpen":true},"sunday":{"open":"09:00","close":"20:00","isOpen":true}}'),
('delivery_area', '{"description":"Centro, Jardim América, Vila Nova, Parque Industrial"}'),
('mercado_pago', '{"isActive":false,"environment":"test","publicKey":"","accessToken":"","status":"disconnected"}'),
('online_payment', '{"isActive":false}'),
('recaptcha', '{"isActive":false,"siteKey":"","secretKey":""}'),
('first_order_verification', '{"isActive":false,"requirePhone":true,"requireDocument":false}');

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_settings_updated_at BEFORE UPDATE ON public.loyalty_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON public.api_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();