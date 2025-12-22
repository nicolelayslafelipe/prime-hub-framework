
-- ====================================================
-- 1️⃣ REMOVER VIEW LEGADA (substituída por função segura)
-- ====================================================
DROP VIEW IF EXISTS public.establishment_public;

-- ====================================================
-- 2️⃣ CRIAR TABELA order_status_logs (Histórico Kanban)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.order_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view order logs" ON public.order_status_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'kitchen')
  );

CREATE POLICY "Clients can view own order logs" ON public.order_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_status_logs.order_id 
      AND orders.customer_id = auth.uid()::text
    )
  );

CREATE POLICY "Staff can insert order logs" ON public.order_status_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'kitchen') OR
    public.has_role(auth.uid(), 'motoboy')
  );

CREATE POLICY "Motoboy can view assigned order logs" ON public.order_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_status_logs.order_id 
      AND orders.motoboy_id = auth.uid()::text
    )
  );

-- ====================================================
-- 3️⃣ CRIAR TABELA payments (MercadoPago)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL,
  provider text NOT NULL DEFAULT 'mercadopago',
  external_id text,
  qr_code text,
  checkout_url text,
  payer_email text,
  payer_document text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payments.order_id 
      AND orders.customer_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payments" ON public.payments
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payments" ON public.payments
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- ====================================================
-- 4️⃣ CRIAR TABELA map_settings (Mapbox)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.map_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapbox_token_encrypted text,
  credentials_version integer DEFAULT 1,
  default_zoom integer DEFAULT 15,
  default_style text DEFAULT 'streets-v12',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage map_settings" ON public.map_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
