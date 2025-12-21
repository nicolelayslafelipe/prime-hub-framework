-- Create cash_registers table for cash control
CREATE TABLE public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  closing_amount NUMERIC,
  expected_amount NUMERIC,
  difference NUMERIC,
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cash_transactions table for cash movements
CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'withdrawal', 'deposit', 'opening')),
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add PDV columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cash_registers
CREATE POLICY "Admins can manage cash_registers" ON public.cash_registers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Kitchen can view cash_registers" ON public.cash_registers
  FOR SELECT USING (has_role(auth.uid(), 'kitchen'));

-- RLS Policies for cash_transactions
CREATE POLICY "Admins can manage cash_transactions" ON public.cash_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Kitchen can view cash_transactions" ON public.cash_transactions
  FOR SELECT USING (has_role(auth.uid(), 'kitchen'));

-- Create updated_at trigger for cash_registers
CREATE TRIGGER update_cash_registers_updated_at
  BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger function for cash_registers
CREATE OR REPLACE FUNCTION public.audit_cash_register_trigger()
RETURNS TRIGGER
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

-- Create audit trigger for cash_registers
CREATE TRIGGER cash_registers_audit_trigger
  AFTER INSERT OR UPDATE ON public.cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_cash_register_trigger();

-- Audit trigger function for cash_transactions
CREATE OR REPLACE FUNCTION public.audit_cash_transaction_trigger()
RETURNS TRIGGER
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

-- Create audit trigger for cash_transactions
CREATE TRIGGER cash_transactions_audit_trigger
  AFTER INSERT OR DELETE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_cash_transaction_trigger();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_registers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_transactions;