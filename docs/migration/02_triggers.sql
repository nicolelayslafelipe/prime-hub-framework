-- =====================================================
-- SCRIPT DE MIGRAÇÃO - TRIGGERS
-- Sistema de Delivery - DeliveryOS
-- =====================================================

-- =====================================================
-- TRIGGER: Criar profile e role para novos usuários
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGERS: Notificações de pedidos
-- =====================================================
DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();

DROP TRIGGER IF EXISTS trigger_notify_order_update ON public.orders;
CREATE TRIGGER trigger_notify_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_update();

-- =====================================================
-- TRIGGER: Log de mudança de status
-- =====================================================
DROP TRIGGER IF EXISTS trigger_log_order_status ON public.orders;
CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- =====================================================
-- TRIGGERS: updated_at automático
-- =====================================================
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_establishment_settings_updated_at ON public.establishment_settings;
CREATE TRIGGER update_establishment_settings_updated_at
  BEFORE UPDATE ON public.establishment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_map_settings_updated_at ON public.map_settings;
CREATE TRIGGER update_map_settings_updated_at
  BEFORE UPDATE ON public.map_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_zones_updated_at ON public.delivery_zones;
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_loyalty_settings_updated_at ON public.loyalty_settings;
CREATE TRIGGER update_loyalty_settings_updated_at
  BEFORE UPDATE ON public.loyalty_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_loyalty_rewards_updated_at ON public.loyalty_rewards;
CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_preferences_updated_at ON public.client_preferences;
CREATE TRIGGER update_client_preferences_updated_at
  BEFORE UPDATE ON public.client_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_integrations_updated_at ON public.api_integrations;
CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON public.api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_status_updated_at ON public.integration_status;
CREATE TRIGGER update_integration_status_updated_at
  BEFORE UPDATE ON public.integration_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cash_registers_updated_at ON public.cash_registers;
CREATE TRIGGER update_cash_registers_updated_at
  BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGERS: Audit logs
-- =====================================================
DROP TRIGGER IF EXISTS audit_coupons ON public.coupons;
CREATE TRIGGER audit_coupons
  AFTER INSERT OR UPDATE OR DELETE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_coupons_trigger();

DROP TRIGGER IF EXISTS audit_payment_methods ON public.payment_methods;
CREATE TRIGGER audit_payment_methods
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_methods_trigger();

DROP TRIGGER IF EXISTS audit_establishment_settings ON public.establishment_settings;
CREATE TRIGGER audit_establishment_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.establishment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_establishment_settings_trigger();

DROP TRIGGER IF EXISTS audit_cash_registers ON public.cash_registers;
CREATE TRIGGER audit_cash_registers
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_cash_register_trigger();

DROP TRIGGER IF EXISTS audit_cash_transactions ON public.cash_transactions;
CREATE TRIGGER audit_cash_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_cash_transaction_trigger();
