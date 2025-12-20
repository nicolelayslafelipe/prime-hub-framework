-- Tabela principal de pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  motoboy_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  additions TEXT[]
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir acesso público por enquanto - sem auth)
CREATE POLICY "Allow public read access to orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to orders" ON public.orders
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to orders" ON public.orders
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to order_items" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to order_items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to order_items" ON public.order_items
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to order_items" ON public.order_items
  FOR DELETE USING (true);

-- HABILITAR REALTIME
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de demonstração (seed)
INSERT INTO public.orders (customer_id, customer_name, customer_phone, customer_address, status, subtotal, delivery_fee, total, payment_method, notes) VALUES
('c1', 'João Silva', '(11) 98888-7777', 'Rua das Flores, 456 - Apt 12', 'pending', 73.70, 5.00, 78.70, 'Cartão de Crédito', NULL),
('c2', 'Maria Santos', '(11) 97777-6666', 'Av. Brasil, 789 - Casa', 'preparing', 57.90, 5.00, 62.90, 'PIX', NULL),
('c3', 'Carlos Oliveira', '(11) 96666-5555', 'Rua Augusta, 1234 - Apt 45', 'ready', 89.90, 0, 89.90, 'Dinheiro', 'Troco para R$ 100'),
('c4', 'Ana Costa', '(11) 95555-4444', 'Rua Oscar Freire, 567', 'out_for_delivery', 50.00, 5.00, 55.00, 'Cartão de Débito', NULL);

-- Inserir itens dos pedidos
INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, additions) 
SELECT o.id, 'p1', 'X-Burger Especial', 2, 32.90, NULL, ARRAY['Bacon extra', 'Queijo cheddar']
FROM public.orders o WHERE o.customer_name = 'João Silva';

INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, additions) 
SELECT o.id, 'p2', 'Batata Frita Grande', 1, 18.90, NULL, NULL
FROM public.orders o WHERE o.customer_name = 'João Silva';

INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, additions) 
SELECT o.id, 'p3', 'Pizza Margherita', 1, 45.90, 'Sem cebola', NULL
FROM public.orders o WHERE o.customer_name = 'Maria Santos';

INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, additions) 
SELECT o.id, 'p4', 'Refrigerante 2L', 1, 12.00, NULL, NULL
FROM public.orders o WHERE o.customer_name = 'Maria Santos';

INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, additions) 
SELECT o.id, 'p5', 'Combo Família', 1, 89.90, NULL, ARRAY['Molho extra']
FROM public.orders o WHERE o.customer_name = 'Carlos Oliveira';

INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, additions) 
SELECT o.id, 'p6', 'Hot Dog Duplo', 2, 25.00, NULL, NULL
FROM public.orders o WHERE o.customer_name = 'Ana Costa';