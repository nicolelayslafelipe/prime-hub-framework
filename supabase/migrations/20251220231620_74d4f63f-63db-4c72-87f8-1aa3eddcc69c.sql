-- Create establishment_settings table for persisting configurations
CREATE TABLE IF NOT EXISTS public.establishment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'DeliveryOS',
  description text,
  logo text,
  banner text,
  banner_text text,
  show_banner boolean DEFAULT false,
  is_open boolean DEFAULT true,
  is_delivery_enabled boolean DEFAULT true,
  min_order_value numeric DEFAULT 20,
  delivery_fee numeric DEFAULT 5,
  estimated_delivery_time integer DEFAULT 45,
  address text DEFAULT 'Rua Exemplo, 123 - Centro',
  phone text DEFAULT '(11) 99999-9999',
  whatsapp text DEFAULT '5511999999999',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image text DEFAULT '🍔',
  category_id text NOT NULL,
  tag text,
  is_available boolean DEFAULT true,
  allow_pickup boolean DEFAULT true,
  preparation_time integer DEFAULT 15,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '🍔',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Establishment settings policies (public read, admin write)
CREATE POLICY "Anyone can view establishment settings"
ON public.establishment_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update establishment settings"
ON public.establishment_settings FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert establishment settings"
ON public.establishment_settings FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Enable realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishment_settings;

-- Triggers for updated_at
CREATE TRIGGER update_establishment_settings_updated_at
  BEFORE UPDATE ON public.establishment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default establishment settings
INSERT INTO public.establishment_settings (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'DeliveryOS', 'Sistema de Delivery Premium')
ON CONFLICT (id) DO NOTHING;