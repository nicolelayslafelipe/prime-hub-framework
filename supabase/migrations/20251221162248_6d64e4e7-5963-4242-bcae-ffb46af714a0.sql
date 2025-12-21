-- Criar tabela de notificações para admins
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('new_order', 'order_paid', 'order_cancelled', 'order_updated', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications(type);

-- Habilitar RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
ON public.admin_notifications FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir insert por triggers (sem restrição de auth)
CREATE POLICY "Allow insert for triggers"
ON public.admin_notifications FOR INSERT
WITH CHECK (true);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para notificar novo pedido
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
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

-- Função para notificar atualização de pedido
CREATE OR REPLACE FUNCTION public.notify_order_update()
RETURNS TRIGGER
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

-- Trigger para novos pedidos
CREATE TRIGGER on_new_order_notification
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();

-- Trigger para atualizações de pedidos
CREATE TRIGGER on_order_update_notification
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_update();