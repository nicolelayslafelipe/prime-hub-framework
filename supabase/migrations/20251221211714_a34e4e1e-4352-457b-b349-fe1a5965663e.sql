-- Criar função de trigger para auditar mudanças em coupons
CREATE OR REPLACE FUNCTION audit_coupons_trigger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar trigger em coupons
DROP TRIGGER IF EXISTS coupons_audit_trigger ON coupons;
CREATE TRIGGER coupons_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON coupons
FOR EACH ROW EXECUTE FUNCTION audit_coupons_trigger();

-- Criar trigger para auditar mudanças em payment_methods
CREATE OR REPLACE FUNCTION audit_payment_methods_trigger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar trigger em payment_methods
DROP TRIGGER IF EXISTS payment_methods_audit_trigger ON payment_methods;
CREATE TRIGGER payment_methods_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON payment_methods
FOR EACH ROW EXECUTE FUNCTION audit_payment_methods_trigger();

-- Criar trigger para auditar mudanças em establishment_settings
CREATE OR REPLACE FUNCTION audit_establishment_settings_trigger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Aplicar trigger em establishment_settings
DROP TRIGGER IF EXISTS establishment_settings_audit_trigger ON establishment_settings;
CREATE TRIGGER establishment_settings_audit_trigger
AFTER UPDATE ON establishment_settings
FOR EACH ROW EXECUTE FUNCTION audit_establishment_settings_trigger();