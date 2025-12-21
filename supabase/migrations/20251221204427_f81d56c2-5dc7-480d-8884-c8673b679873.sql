-- PARTE 1: CORRIGIR RLS DA TABELA admin_settings

-- Remover a policy pública que permite qualquer pessoa ver os dados
DROP POLICY IF EXISTS "Anyone can view admin_settings" ON public.admin_settings;

-- Criar nova policy que permite SELECT apenas para admins autenticados
CREATE POLICY "Only admins can view admin_settings" 
ON public.admin_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- PARTE 2: Criar tabela de auditoria para logs de segurança
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir insert para triggers e edge functions
CREATE POLICY "Allow insert for authenticated users"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);