
-- ============================================
-- BLINDAGEM TOTAL DE SEGURANÇA RLS
-- ============================================

-- ============================================
-- PARTE 1: TABELA ORDERS
-- ============================================

-- Remover políticas públicas perigosas
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public update access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete access to orders" ON orders;

-- 1. Cliente pode ver apenas seus próprios pedidos
CREATE POLICY "Clients can view own orders" ON orders
  FOR SELECT
  USING (customer_id = auth.uid()::text);

-- 2. Cliente pode criar pedido (apenas para si mesmo)
CREATE POLICY "Clients can create own orders" ON orders
  FOR INSERT
  WITH CHECK (customer_id = auth.uid()::text);

-- 3. Admin e Kitchen podem ver todos os pedidos
CREATE POLICY "Staff can view all orders" ON orders
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'kitchen')
  );

-- 4. Admin e Kitchen podem atualizar pedidos
CREATE POLICY "Staff can update orders" ON orders
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'kitchen')
  );

-- 5. Motoboy pode ver apenas pedidos atribuídos a ele
CREATE POLICY "Motoboy can view assigned orders" ON orders
  FOR SELECT
  USING (motoboy_id = auth.uid()::text);

-- 6. Motoboy pode atualizar status de pedidos atribuídos
CREATE POLICY "Motoboy can update assigned orders" ON orders
  FOR UPDATE
  USING (motoboy_id = auth.uid()::text);

-- 7. Apenas admin pode deletar pedidos
CREATE POLICY "Only admins can delete orders" ON orders
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PARTE 2: TABELA ORDER_ITEMS
-- ============================================

-- Remover políticas públicas perigosas
DROP POLICY IF EXISTS "Allow public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public insert access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public update access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public delete access to order_items" ON order_items;

-- 1. Cliente pode ver itens dos seus pedidos
CREATE POLICY "Clients can view own order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id = auth.uid()::text
    )
  );

-- 2. Cliente pode inserir itens nos seus pedidos
CREATE POLICY "Clients can insert own order items" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id = auth.uid()::text
    )
  );

-- 3. Staff pode ver todos os itens
CREATE POLICY "Staff can view all order items" ON order_items
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'kitchen')
  );

-- 4. Apenas admin pode atualizar itens
CREATE POLICY "Only admins can update order items" ON order_items
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- 5. Apenas admin pode deletar itens
CREATE POLICY "Only admins can delete order items" ON order_items
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 6. Motoboy pode ver itens dos pedidos atribuídos
CREATE POLICY "Motoboy can view assigned order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.motoboy_id = auth.uid()::text
    )
  );

-- ============================================
-- PARTE 3: TABELA COUPONS
-- ============================================

-- Remover política antiga sem validação de datas
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;

-- Criar política com validação de datas
CREATE POLICY "Anyone can view valid coupons" ON coupons
  FOR SELECT
  USING (
    is_active = true 
    AND valid_from <= now() 
    AND (valid_until IS NULL OR valid_until >= now())
  );

-- ============================================
-- PARTE 4: TABELA PUSH_SUBSCRIPTIONS
-- ============================================

-- Adicionar política para admin ver todas as subscriptions
CREATE POLICY "Admins can view all push subscriptions" ON push_subscriptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
