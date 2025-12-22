-- =====================================================
-- SCRIPT DE MIGRAÇÃO - POLÍTICAS RLS
-- Sistema de Delivery - DeliveryOS
-- =====================================================

-- =====================================================
-- RLS: user_roles
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can update user roles" 
ON public.user_roles FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles" 
ON public.user_roles FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: profiles
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: categories
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" 
ON public.categories FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" 
ON public.categories FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" 
ON public.categories FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- =====================================================
-- RLS: products
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" 
ON public.products FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- =====================================================
-- RLS: addresses
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" 
ON public.addresses FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own addresses" ON public.addresses;
CREATE POLICY "Users can create their own addresses" 
ON public.addresses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" 
ON public.addresses FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" 
ON public.addresses FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- RLS: orders
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own orders" ON public.orders;
CREATE POLICY "Clients can view own orders" 
ON public.orders FOR SELECT 
USING (customer_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
CREATE POLICY "Staff can view all orders" 
ON public.orders FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));

DROP POLICY IF EXISTS "Motoboy can view ready and assigned orders" ON public.orders;
CREATE POLICY "Motoboy can view ready and assigned orders" 
ON public.orders FOR SELECT 
USING (has_role(auth.uid(), 'motoboy') AND (status = 'ready' OR motoboy_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Clients can create own orders" ON public.orders;
CREATE POLICY "Clients can create own orders" 
ON public.orders FOR INSERT 
WITH CHECK (customer_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" 
ON public.orders FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));

DROP POLICY IF EXISTS "Motoboy can update ready and assigned orders" ON public.orders;
CREATE POLICY "Motoboy can update ready and assigned orders" 
ON public.orders FOR UPDATE 
USING (has_role(auth.uid(), 'motoboy') AND (status = 'ready' OR motoboy_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
CREATE POLICY "Only admins can delete orders" 
ON public.orders FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: order_items
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own order items" ON public.order_items;
CREATE POLICY "Clients can view own order items" 
ON public.order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Staff can view all order items" ON public.order_items;
CREATE POLICY "Staff can view all order items" 
ON public.order_items FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));

DROP POLICY IF EXISTS "Motoboy can view ready and assigned order items" ON public.order_items;
CREATE POLICY "Motoboy can view ready and assigned order items" 
ON public.order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND has_role(auth.uid(), 'motoboy') AND (orders.status = 'ready' OR orders.motoboy_id = (auth.uid())::text)));

DROP POLICY IF EXISTS "Clients can insert own order items" ON public.order_items;
CREATE POLICY "Clients can insert own order items" 
ON public.order_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can update order items" ON public.order_items;
CREATE POLICY "Only admins can update order items" 
ON public.order_items FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete order items" ON public.order_items;
CREATE POLICY "Only admins can delete order items" 
ON public.order_items FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: order_status_logs
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own order logs" ON public.order_status_logs;
CREATE POLICY "Clients can view own order logs" 
ON public.order_status_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_logs.order_id AND orders.customer_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Staff can view order logs" ON public.order_status_logs;
CREATE POLICY "Staff can view order logs" 
ON public.order_status_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen'));

DROP POLICY IF EXISTS "Motoboy can view assigned order logs" ON public.order_status_logs;
CREATE POLICY "Motoboy can view assigned order logs" 
ON public.order_status_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_logs.order_id AND orders.motoboy_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Staff can insert order logs" ON public.order_status_logs;
CREATE POLICY "Staff can insert order logs" 
ON public.order_status_logs FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'kitchen') OR has_role(auth.uid(), 'motoboy'));

-- =====================================================
-- RLS: payments
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments;
CREATE POLICY "Clients can view own payments" 
ON public.payments FOR SELECT 
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = (auth.uid())::text));

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" 
ON public.payments FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert payments" ON public.payments;
CREATE POLICY "Admins can insert payments" 
ON public.payments FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" 
ON public.payments FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" 
ON public.payments FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: payment_methods
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view payment_methods" ON public.payment_methods;
CREATE POLICY "Anyone can view payment_methods" 
ON public.payment_methods FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert payment_methods" ON public.payment_methods;
CREATE POLICY "Admins can insert payment_methods" 
ON public.payment_methods FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update payment_methods" ON public.payment_methods;
CREATE POLICY "Admins can update payment_methods" 
ON public.payment_methods FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete payment_methods" ON public.payment_methods;
CREATE POLICY "Admins can delete payment_methods" 
ON public.payment_methods FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: establishment_settings
-- =====================================================
DROP POLICY IF EXISTS "Only admins can view full establishment_settings" ON public.establishment_settings;
CREATE POLICY "Only admins can view full establishment_settings" 
ON public.establishment_settings FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert establishment settings" ON public.establishment_settings;
CREATE POLICY "Admins can insert establishment settings" 
ON public.establishment_settings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update establishment settings" ON public.establishment_settings;
CREATE POLICY "Admins can update establishment settings" 
ON public.establishment_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- =====================================================
-- RLS: delivery_zones
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view active delivery_zones" ON public.delivery_zones;
CREATE POLICY "Anyone can view active delivery_zones" 
ON public.delivery_zones FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert delivery_zones" ON public.delivery_zones;
CREATE POLICY "Admins can insert delivery_zones" 
ON public.delivery_zones FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update delivery_zones" ON public.delivery_zones;
CREATE POLICY "Admins can update delivery_zones" 
ON public.delivery_zones FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete delivery_zones" ON public.delivery_zones;
CREATE POLICY "Admins can delete delivery_zones" 
ON public.delivery_zones FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: banners
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view banners" ON public.banners;
CREATE POLICY "Anyone can view banners" 
ON public.banners FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
CREATE POLICY "Admins can insert banners" 
ON public.banners FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
CREATE POLICY "Admins can update banners" 
ON public.banners FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;
CREATE POLICY "Admins can delete banners" 
ON public.banners FOR DELETE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- =====================================================
-- RLS: coupons
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view valid coupons" ON public.coupons;
CREATE POLICY "Anyone can view valid coupons" 
ON public.coupons FOR SELECT 
USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));

DROP POLICY IF EXISTS "Admins can view all coupons" ON public.coupons;
CREATE POLICY "Admins can view all coupons" 
ON public.coupons FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
CREATE POLICY "Admins can insert coupons" 
ON public.coupons FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
CREATE POLICY "Admins can update coupons" 
ON public.coupons FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
CREATE POLICY "Admins can delete coupons" 
ON public.coupons FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: loyalty_settings
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view loyalty_settings" ON public.loyalty_settings;
CREATE POLICY "Anyone can view loyalty_settings" 
ON public.loyalty_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert loyalty_settings" ON public.loyalty_settings;
CREATE POLICY "Admins can insert loyalty_settings" 
ON public.loyalty_settings FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update loyalty_settings" ON public.loyalty_settings;
CREATE POLICY "Admins can update loyalty_settings" 
ON public.loyalty_settings FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: loyalty_rewards
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view loyalty_rewards" ON public.loyalty_rewards;
CREATE POLICY "Anyone can view loyalty_rewards" 
ON public.loyalty_rewards FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert loyalty_rewards" ON public.loyalty_rewards;
CREATE POLICY "Admins can insert loyalty_rewards" 
ON public.loyalty_rewards FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update loyalty_rewards" ON public.loyalty_rewards;
CREATE POLICY "Admins can update loyalty_rewards" 
ON public.loyalty_rewards FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete loyalty_rewards" ON public.loyalty_rewards;
CREATE POLICY "Admins can delete loyalty_rewards" 
ON public.loyalty_rewards FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: message_templates
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view message_templates" ON public.message_templates;
CREATE POLICY "Anyone can view message_templates" 
ON public.message_templates FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert message_templates" ON public.message_templates;
CREATE POLICY "Admins can insert message_templates" 
ON public.message_templates FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update message_templates" ON public.message_templates;
CREATE POLICY "Admins can update message_templates" 
ON public.message_templates FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete message_templates" ON public.message_templates;
CREATE POLICY "Admins can delete message_templates" 
ON public.message_templates FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: admin_notifications
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view all notifications" 
ON public.admin_notifications FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications" 
ON public.admin_notifications FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.admin_notifications;
CREATE POLICY "Admins can delete notifications" 
ON public.admin_notifications FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: admin_audit_logs
-- =====================================================
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Only admins can view audit logs" 
ON public.admin_audit_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.admin_audit_logs;
CREATE POLICY "Allow insert for authenticated users" 
ON public.admin_audit_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- RLS: admin_settings
-- =====================================================
DROP POLICY IF EXISTS "Only admins can view admin_settings" ON public.admin_settings;
CREATE POLICY "Only admins can view admin_settings" 
ON public.admin_settings FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert admin_settings" ON public.admin_settings;
CREATE POLICY "Admins can insert admin_settings" 
ON public.admin_settings FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update admin_settings" ON public.admin_settings;
CREATE POLICY "Admins can update admin_settings" 
ON public.admin_settings FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete admin_settings" ON public.admin_settings;
CREATE POLICY "Admins can delete admin_settings" 
ON public.admin_settings FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: sound_settings
-- =====================================================
DROP POLICY IF EXISTS "Allow public read access to sound_settings" ON public.sound_settings;
CREATE POLICY "Allow public read access to sound_settings" 
ON public.sound_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert sound_settings" ON public.sound_settings;
CREATE POLICY "Admins can insert sound_settings" 
ON public.sound_settings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update sound_settings" ON public.sound_settings;
CREATE POLICY "Admins can update sound_settings" 
ON public.sound_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- =====================================================
-- RLS: client_preferences
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.client_preferences;
CREATE POLICY "Users can view their own preferences" 
ON public.client_preferences FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.client_preferences;
CREATE POLICY "Users can insert their own preferences" 
ON public.client_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.client_preferences;
CREATE POLICY "Users can update their own preferences" 
ON public.client_preferences FOR UPDATE 
USING (auth.uid() = user_id);

-- =====================================================
-- RLS: push_subscriptions
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admins can view all push subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" 
ON public.push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own subscriptions" 
ON public.push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- RLS: map_settings
-- =====================================================
DROP POLICY IF EXISTS "Only admins can manage map_settings" ON public.map_settings;
CREATE POLICY "Only admins can manage map_settings" 
ON public.map_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: api_integrations
-- =====================================================
DROP POLICY IF EXISTS "Only admins can view api_integrations" ON public.api_integrations;
CREATE POLICY "Only admins can view api_integrations" 
ON public.api_integrations FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert api_integrations" ON public.api_integrations;
CREATE POLICY "Admins can insert api_integrations" 
ON public.api_integrations FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update api_integrations" ON public.api_integrations;
CREATE POLICY "Admins can update api_integrations" 
ON public.api_integrations FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: integration_status
-- =====================================================
DROP POLICY IF EXISTS "Only admins can view integration_status" ON public.integration_status;
CREATE POLICY "Only admins can view integration_status" 
ON public.integration_status FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage integration_status" ON public.integration_status;
CREATE POLICY "Admins can manage integration_status" 
ON public.integration_status FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: integration_logs
-- =====================================================
DROP POLICY IF EXISTS "Admins can view integration_logs" ON public.integration_logs;
CREATE POLICY "Admins can view integration_logs" 
ON public.integration_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage integration_logs" ON public.integration_logs;
CREATE POLICY "Admins can manage integration_logs" 
ON public.integration_logs FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: cash_registers
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage cash_registers" ON public.cash_registers;
CREATE POLICY "Admins can manage cash_registers" 
ON public.cash_registers FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS: cash_transactions
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage cash_transactions" ON public.cash_transactions;
CREATE POLICY "Admins can manage cash_transactions" 
ON public.cash_transactions FOR ALL 
USING (has_role(auth.uid(), 'admin'));
