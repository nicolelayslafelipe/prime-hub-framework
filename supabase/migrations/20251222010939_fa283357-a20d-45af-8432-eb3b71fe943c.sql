-- Criar tabela de status das integrações
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
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de logs das integrações
CREATE TABLE public.integration_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_key TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para integration_status
CREATE POLICY "Admins can manage integration_status" 
ON public.integration_status 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view integration_status" 
ON public.integration_status 
FOR SELECT 
USING (true);

-- Políticas RLS para integration_logs
CREATE POLICY "Admins can manage integration_logs" 
ON public.integration_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view integration_logs" 
ON public.integration_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_integration_status_updated_at
BEFORE UPDATE ON public.integration_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.integration_status (integration_key, integration_name, status, is_active) VALUES
('mercadopago', 'Mercado Pago', 'unknown', true),
('mapbox', 'Mapbox', 'unknown', true);

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_logs;